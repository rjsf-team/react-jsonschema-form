// @ts-check
// Where upgrade guides live, relative to the docs content directory: a version's entries are
// `migration-guides/v<N>/<id>.md` and its filtered page is `migration-guides/v<N>.x upgrade guide.mdx` beside that
// directory.

const GUIDES_DIR = 'migration-guides';
const VERSION_DIR = /^v(\d+)$/;

/**
 * The filtered page's file name without its extension, which is also the last part of its URL, for the version whose
 * directory is `versionDir`, e.g. `v7.x upgrade guide`.
 *
 * @param {string} versionDir
 */
function filteredPageName(versionDir) {
  return `${versionDir}.x upgrade guide`;
}

/** @param {string} versionDir */
function filteredPageFile(versionDir) {
  return `${filteredPageName(versionDir)}.mdx`;
}

/**
 * Whether a doc in `sourceDirName` (POSIX, relative to the docs content directory) is an upgrade guide entry.
 *
 * @param {string} sourceDirName
 */
function isUpgradeGuideDir(sourceDirName) {
  const [guides, version] = sourceDirName.split('/');
  return guides === GUIDES_DIR && version !== undefined && VERSION_DIR.test(version);
}

module.exports = { GUIDES_DIR, VERSION_DIR, filteredPageFile, filteredPageName, isUpgradeGuideDir };
