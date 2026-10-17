/** Synthetic source only. Never copy production exports into this package. */
export function sourceFixture(variant = 1) {
  const n = variant === 1 ? '1' : '2';
  const projectId = `${n}0000000-0000-0000-0000-000000000001`;
  const baselineId = `${n}0000000-0000-0000-0000-000000000002`;
  const clientId = `${n}0000000-0000-0000-0000-000000000003`;
  const adminId = `${n}0000000-0000-0000-0000-000000000004`;
  const question = (id, type = 'text', extra = {}) => ({ id, label: `Synthetic ${id}`, help: '', type, required: false, expert: false, ...extra });
  const custom = question(`custom/${n}~detail`, 'text');
  const questions = [question(`enabled.${n}`, 'boolean'), question(`count.${n}`, 'number'), question(`detail.${n}`, 'text', { visibleWhen: { questionId: `enabled.${n}`, operator: 'equals', value: false } })];
  if (variant !== 1) questions.push(question('extra.two'));
  const contentHash = (variant === 1 ? 'a' : 'b').repeat(64);
  return {
    schemaVersion: '1.0.0', project: { id: projectId, name: `Synthetic project ${n}`, summary: '', organization: { id: adminId, name: 'Synthetic organization' } },
    baseline: { id: baselineId, version: variant, requiredClientId: clientId }, contentHash, lockedAt: '2026-10-17T10:00:00Z',
    approvals: [{ role: 'CLIENT', userId: clientId, hash: contentHash, approvedAt: '2026-10-17T09:00:00Z' }, { role: 'ADMIN', userId: adminId, hash: contentHash, approvedAt: '2026-10-17T09:01:00Z' }],
    effectiveCatalog: { version: '1.0.0', sections: [{ id: `section.${n}`, title: 'Synthetic section', questions }, { id: `category.${n}`, title: 'Custom', questions: [custom] }] },
    requirements: { catalogVersion: '1.0.0', answers: { [`enabled.${n}`]: { value: false, status: 'CONFIRMED', note: '' }, [`count.${n}`]: { value: 0, status: 'TENTATIVE', note: '' }, [custom.id]: { value: 'Captured custom content', status: 'TENTATIVE', note: '' } },
      categories: [{ id: `category.${n}`, name: 'Custom', description: '', questions: [structuredClone(custom)] }],
      requirements: [{ id: `requirement.${n}`, title: 'Synthetic requirement', categoryId: `category.${n}`, status: 'CONFIRMED', references: [`reference.${n}`] }],
      features: [{ id: `feature.${n}`, title: 'Synthetic feature', categoryId: '', status: 'TENTATIVE', references: [], dependencies: [] }],
      pages: [{ id: `page.${n}`, name: 'Synthetic page', route: `/project-${n}`, featureIds: [`feature.${n}`] }],
      entities: [{ id: `entity.${n}`, name: 'Synthetic record', fields: [{ id: `field.${n}`, name: 'value', type: 'text' }] }],
      references: [{ id: `reference.${n}`, title: 'Synthetic reference', url: 'https://example.invalid' }],
      decisions: [{ id: `decision.${n}`, title: 'Synthetic decision', status: variant === 1 ? 'OPEN' : 'ACCEPTED', relatedIds: [`entity.${n}`] }],
      commercial: { quotedPrice: '', currency: 'EUR', paymentMilestones: '', deliveryExpectations: '', exclusions: '', approvalStatus: 'DRAFT', updatedBy: adminId } },
    history: [{ id: `history.${n}`, action: 'CREATED' }], changeRequests: [],
  };
}
export const captureFixture = (variant = 1) => {
  const data = sourceFixture(variant);
  const text = ` ${JSON.stringify(data, null, 2)}\n`;
  return { data, text, baseline: { ...data.baseline, hash: data.contentHash, state: 'LOCKED' }, apiUrl: 'https://discovery.example.invalid/api' };
};
