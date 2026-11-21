import { expect, test } from '../../../fixtures/pom/test-options';
import {
    lighthouseModes,
    lighthousePageCount,
    npmScript,
    readWorkflow,
} from '../../../helpers/site/workflows';
import {
    PipelineFacts,
    PipelineNumbers,
    PipelineText,
    WorkflowFiles,
} from '../../../enums/site/projects';

/**
 * The home page describes three pipelines. These checks read the real workflow
 * files, so the page cannot say more than the pipelines actually do.
 */
test.describe('Pipelines: the page only claims what the workflows do', () => {
    test(
        'should run static checks, smoke and data tests on every commit to a branch',
        { tag: '@sanity' },
        () => {
            const workflow = readWorkflow(WorkflowFiles.COMMIT);
            expect(workflow).toContain(PipelineFacts.commit.trigger);
            for (const step of PipelineFacts.commit.steps) {
                expect(workflow, `commit workflow runs "${step}"`).toContain(
                    step
                );
            }
            expect(npmScript('test:smoke')).toContain('--grep @smoke');
            expect(npmScript('test:sanity')).toContain('--grep @sanity');
            expect(PipelineText.COMMIT_DESCRIPTION).toContain('smoke');
            expect(PipelineText.COMMIT_DESCRIPTION).toContain(
                'translation-data'
            );
        }
    );

    test(
        'should run the full suite and the Lighthouse gate on every merge to main',
        { tag: '@sanity' },
        () => {
            const workflow = readWorkflow(WorkflowFiles.MAIN);
            expect(workflow).toContain(PipelineFacts.main.trigger);
            for (const step of PipelineFacts.main.steps) {
                expect(workflow, `main workflow runs "${step}"`).toContain(
                    step
                );
            }
            // "the full suite" means no tag filter on the command it runs
            expect(npmScript('test:ci')).not.toContain('--grep');
            expect(PipelineText.MAIN_DESCRIPTION).toContain('regression');
        }
    );

    test(
        'should audit exactly the number of pages in mobile and desktop mode that the page states',
        { tag: '@sanity' },
        () => {
            expect(lighthousePageCount()).toBe(
                PipelineNumbers.LIGHTHOUSE_PAGES
            );
            expect(lighthouseModes().sort()).toEqual(['desktop', 'mobile']);
            expect(PipelineText.MAIN_DESCRIPTION).toContain('four pages');
            expect(PipelineText.MAIN_DESCRIPTION).toContain(
                'mobile and desktop mode'
            );
        }
    );

    test(
        'should run on a schedule against the live site, with Lighthouse and Firefox and WebKit smoke tests',
        { tag: '@sanity' },
        () => {
            const workflow = readWorkflow(WorkflowFiles.NIGHTLY);
            expect(workflow).toContain(PipelineFacts.nightly.schedule);
            for (const step of PipelineFacts.nightly.steps) {
                expect(workflow, `nightly workflow has "${step}"`).toContain(
                    step
                );
            }
            expect(PipelineText.NIGHT_DESCRIPTION).toContain('live site');
            expect(PipelineText.NIGHT_DESCRIPTION).toContain('Firefox');
            expect(PipelineText.NIGHT_DESCRIPTION).toContain('WebKit');
        }
    );
});
