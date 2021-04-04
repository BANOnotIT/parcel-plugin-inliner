const fs = require("fs");
const postHTML = require("posthtml");
const posthtmlInlineAssets = require("posthtml-inline-assets");

module.exports = bundler => {
  bundler.on("bundled", (bundle) => {
    if (process.env.NODE_ENV !== "production" && !process.env.INLINE_ASSETS) return;

    const bundles = Array.from(bundle.childBundles).concat([bundle]);
    return Promise.all(bundles.map(async bundle => {
      if (!bundle.entryAsset || bundle.entryAsset.type !== "html") return;

      const cwd = bundle.entryAsset.options.outDir;
      const data = fs.readFileSync(bundle.name);
      const transforms = { 
        image: false,
        favicon: false,
        script: { 
          resolve(node) {
            return node.tag === 'script' && node.attrs && node.attrs.src && !node.attrs.async; 
          },
          transform(node, data) {
            delete node.attrs.src;

            node.content = [
              data.buffer.toString('utf8')
            ];
          }
        }
      }
      const result = await postHTML([posthtmlInlineAssets({ cwd, root: cwd, transforms })]).process(data);
      fs.writeFileSync(bundle.name, result.html);
    }));
  });
};
