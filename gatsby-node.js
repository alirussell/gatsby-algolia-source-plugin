const algoliasearch = require('algoliasearch');
const assert = require('assert');

exports.sourceNodes = (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
    const { createNode } = actions

    // Gatsby adds a configOption that's not needed for this plugin, delete it
    delete configOptions.plugins

    assert(configOptions.appId, 'A valid Algolia application id is required (appId).');
    assert(configOptions.apiKey, 'A valid Algolia api key is required (apiKey).');
    assert(configOptions.index, 'A valid Algolia index name is required (index).');

    const nodeType = configOptions.nodeType || 'AlgoliaHit';

    console.log('Sourcing', nodeType, 'nodes from', configOptions.index);

    const searchClient = algoliasearch(configOptions.appId, configOptions.apiKey);
    const index = searchClient.initIndex(configOptions.index);

    const processHit = hit => {
        const nodeId = createNodeId(`algolia-hit-${hit.id}`)
        const nodeContent = JSON.stringify(hit)
    
        const nodeData = Object.assign({}, hit, {
          id: nodeId,
          parent: null,
          children: [],
          internal: {
            type: nodeType,
            content: nodeContent,
            contentDigest: createContentDigest(hit),
          },
        })
    
        return nodeData
    }

    return new Promise((resolve, reject) => {
        index.setSettings(configOptions.indexSettings || {}, (err, content) => {
        
            if (err) {
                return reject(err);
            }

            index.search({
                search: configOptions.search,
                filters: configOptions.filters
            }, (err, content) => {

                if (err) {
                    return reject(err);
                }

                console.log('got', content.hits.length, 'alogolia hits')

                content.hits.forEach(hit => {
                    const hitData = processHit(hit);
                    createNode(hitData);
                })

                resolve();

            })
        });
    });

}