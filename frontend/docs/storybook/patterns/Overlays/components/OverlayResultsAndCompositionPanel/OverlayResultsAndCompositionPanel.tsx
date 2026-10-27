import { ExampleGallery, type ExampleGalleryResources } from "../../../shared/gallery";

import { useDevelopmentGuideTranslation } from "../../../../examples/shared/localization/useDevelopmentGuideTranslation";

import { TypedResultPreview } from "./TypedResultPreview";

import { OutcomePreview } from "./OutcomePreview";

import { UpdatePropsPreview } from "./UpdatePropsPreview";

import { NestedOverlayPreview } from "./NestedOverlayPreview";

const typedResultCode = `const overlays = useRgoOverlays()

const handle = overlays.open(ProjectPicker, { projectId }, {
  presentation: 'dialog',
})
const result = await handle.result

if (result.status === 'completed') {
  selectProject(result.value)
}`;

const outcomeCode = `const overlays = useRgoOverlays()
const result = await overlays.open(Editor, {}, {
  presentation: 'dialog',
}).result

if (result.status === 'completed') save(result.value)
else reportCancellation(result.reason)`;

const updatePropsCode = `const overlays = useRgoOverlays()
const handle = overlays.open(ProjectDetails, { revision: 1 }, {
  presentation: 'docked',
  side: 'right',
})

handle.updateProps({ revision: 2 })`;

const nestedCode = `// Inside the active parent overlay content.
const overlays = useRgoOverlays()
const result = await overlays.open(CustomerPicker, {}, {
  presentation: 'dialog',
}).result

if (result.status === 'completed') {
  setCustomer(result.value)
}`;

export function OverlayResultsAndCompositionPanel() {
  const { t } = useDevelopmentGuideTranslation();
  const resources = {
    codeLabels: {
      hide: t("exampleGallery.code.hide"),
      language: t("exampleGallery.code.language"),
      show: t("exampleGallery.code.show"),
    },
    contents: {
      label: t("overlayExamples.results.contents.label"),
      title: t("overlayExamples.results.contents.title"),
    },
    examples: [
      {
        code: typedResultCode,
        description: t("overlayExamples.results.typed.description"),
        id: "overlay-typed-result",
        sourcePath:
          "docs/storybook/patterns/Overlays/components/OverlayResultsAndCompositionPanel/TypedResultPreview.tsx",
        preview: <TypedResultPreview />,
        title: t("overlayExamples.results.typed.title"),
      },
      {
        code: outcomeCode,
        description: t("overlayExamples.results.outcomes.description"),
        id: "overlay-result-outcomes",
        sourcePath: "docs/storybook/patterns/Overlays/components/OverlayResultsAndCompositionPanel/OutcomePreview.tsx",
        preview: <OutcomePreview />,
        title: t("overlayExamples.results.outcomes.title"),
      },
      {
        code: updatePropsCode,
        description: t("overlayExamples.results.updates.description"),
        id: "overlay-update-props",
        sourcePath:
          "docs/storybook/patterns/Overlays/components/OverlayResultsAndCompositionPanel/UpdatePropsPreview.tsx",
        preview: <UpdatePropsPreview />,
        title: t("overlayExamples.results.updates.title"),
      },
      {
        code: nestedCode,
        description: t("overlayExamples.results.nested.description"),
        id: "overlay-nested",
        sourcePath:
          "docs/storybook/patterns/Overlays/components/OverlayResultsAndCompositionPanel/NestedOverlayPreview.tsx",
        preview: <NestedOverlayPreview />,
        title: t("overlayExamples.results.nested.title"),
      },
    ],
  } satisfies ExampleGalleryResources;
  return <ExampleGallery resources={resources} />;
}
