var objFactory = require('./objFactory');

/**
 * Processes the content.opf xml manifest into a more manageable js object form
 */

/**
 * Runs the separate processors for each major type of manifest category and returns the compiled manifest
 * @param  {object} contentpackage The content.opf package root object from which the processors will derive their compilations from
 * @return {object}  A custom object containing the 4 major manifest categories (metadata, manifest, spline, guide)
 */
function processManifest(contentpackage, opfPath){
    //console.log(contentpackage);
    var returnable = objFactory.EpubManifest();
    Object.keys(contentpackage).forEach((item)=>{
        if(item !== '$'){
            switch(item){
                case 'metadata':
                    returnable.metadata = assembleMetadata(contentpackage.metadata[0]);
                    break;
                case 'manifest':
                    returnable.manifest = assembleManifest(contentpackage.manifest[0]);
                    break;
                case 'spine':
                    returnable.spine = assembleSpine(contentpackage.spine[0]);
                    break;
                case 'guide':
                    returnable.guide = assembleGuide(contentpackage.guide[0]);
                    break;
                default:
                    break;
            }
        }
    })
    
    returnable.contentBasePath = opfPath;
    //console.log(returnable);

    return returnable;
}

var metaSearches = [
    {
        name: 'title'
    },
    {
        name: "creator",
        handler: function(item){ return item[0]._ || ""; }
    }
];
function assembleMetadata(source){
    var returnable = {};

    metaSearches.forEach(function(item){
        if(source[item.name]){
            if(item.handler){
                returnable[item.name] = item.handler(source[item.name]);
            }
            else{
                returnable[item.name] = source[item.name][0];
            }

        }
    })

    return returnable;
}

function assembleManifest(source){
    return source.item.map(function(asset){
        return {
            href: asset.$.href,
            id: asset.$.id,
            "media-type": asset.$["media-type"],
        };
    });
}

function assembleSpine(source){
    //assemble the spine, which is used as the Table Of Contents in the epub format
    return source.itemref.map(function(item){
        return item.$.idref;
    });
}

function assembleGuide(source){
    //assemble the guide, which is used as a quick-reference to main areas of the ebook.  This is an optional aspect of the epub format as the
    //spine provides the effective reading order
    //think of the guide as an appendix/search guide to the structure of the epub file
    if(source && source.reference){
        return source.reference.map(function(item){
            return {
                href: item.$.href,
                title: item.$.title,
                type: item.$.type
            }
        })
    }
}

module.exports = {
    processManifest: function(contents, opfPath){
        return processManifest(contents.package, opfPath);
    }
}
