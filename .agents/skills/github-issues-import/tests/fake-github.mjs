import { ProviderError } from "../scripts/transport.mjs";

export class FakeGitHub {
  constructor(repository = "example/consumer") {
    this.repository = repository;
    this.repositoryId = 555;
    this.issues = [];
    this.labels = [];
    this.parents = new Map();
    this.blockers = new Map();
    this.requests = [];
    this.writes = [];
    this.nextNumber = 1;
    this.failAfter = null;
    this.failBefore = null;
  }
  seed(title, body, state = "open") {
    const number = this.nextNumber++;
    const issue = {
      id: number + 10_000,
      number,
      title,
      body,
      state,
      html_url: `https://github.com/${this.repository}/issues/${number}`,
    };
    this.issues.push(issue);
    return structuredClone(issue);
  }
  async request(method, endpoint, payload) {
    this.requests.push({ method, endpoint, payload });
    if (method !== "GET") this.writes.push({ method, endpoint, payload });
    if (this.failBefore?.(method, endpoint, payload))
      throw new ProviderError("Synthetic uncertain network failure.");
    const pathname = endpoint.split("?")[0];
    const base = `repos/${this.repository}`;
    let response;
    if (method === "GET" && pathname === base)
      response = {
        id: this.repositoryId,
        full_name: this.repository,
        has_issues: true,
      };
    else if (method === "GET" && pathname === `${base}/labels`)
      response = this.labels;
    else if (method === "POST" && pathname === `${base}/labels`) {
      this.labels.push(structuredClone(payload));
      response = payload;
    } else if (method === "GET" && pathname === `${base}/issues`)
      response = this.issues;
    else if (method === "POST" && pathname === `${base}/issues`)
      response = this.seed(payload.title, payload.body);
    else {
      const match = pathname.match(/\/issues\/(\d+)(.*)$/);
      const number = Number(match?.[1]);
      const issue = this.issues.find((item) => item.number === number);
      if (!issue) throw new ProviderError("Synthetic issue missing.", 404);
      const suffix = match[2];
      if (method === "GET" && suffix === "") response = issue;
      else if (method === "PATCH" && suffix === "") {
        Object.assign(issue, payload);
        response = issue;
      } else if (method === "GET" && suffix === "/parent") {
        const parentId = this.parents.get(issue.id);
        response = this.issues.find((item) => item.id === parentId);
        if (!response)
          throw new ProviderError("Synthetic parent missing.", 404);
      } else if (method === "POST" && suffix === "/sub_issues") {
        this.parents.set(payload.sub_issue_id, issue.id);
        response = this.issues.find((item) => item.id === payload.sub_issue_id);
      } else if (method === "GET" && suffix === "/dependencies/blocked_by") {
        response = this.issues.filter((item) =>
          (this.blockers.get(issue.id) ?? []).includes(item.id),
        );
      } else if (method === "POST" && suffix === "/dependencies/blocked_by") {
        this.blockers.set(issue.id, [
          ...(this.blockers.get(issue.id) ?? []),
          payload.issue_id,
        ]);
        response = this.issues.find((item) => item.id === payload.issue_id);
      } else
        throw new Error(`Unexpected synthetic request: ${method} ${pathname}`);
    }
    if (this.failAfter?.(method, endpoint, payload))
      throw new ProviderError("Synthetic lost successful response.");
    if (Array.isArray(response) && method === "GET") {
      const query = new URLSearchParams(endpoint.split("?")[1]);
      const page = Number(query.get("page") ?? "1");
      const pageSize = Number(query.get("per_page") ?? "100");
      response = response.slice((page - 1) * pageSize, page * pageSize);
    }
    return structuredClone(response);
  }
}
