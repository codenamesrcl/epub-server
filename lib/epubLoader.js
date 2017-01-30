var lib7z = require('7z-wrapper'),
    objFactory = require('./objFactory'),
    opfProcess = require('./opfProcess'),
    xml2js = require('xml2js'),
    stripPrefix = require('xml2js').processors.stripPrefix,
    path = require('path');

function valueEvaluator(value){
    //console.log(value);
    return value;
}

var xmlParseConfig = {
    tagNameProcessors: [stripPrefix],
    attrNameProcessors: [stripPrefix],
    //valueProcessors: [valueEvaluator],
    //attrValueProcessors: [valueEvaluator],
}
var xmlParser = new xml2js.Parser(xmlParseConfig).parseString;

/**
 * Load the target epub manifest into memory for future reference
 * @param  {string} filepath The absolute path of the epub to load
 * @return {Promise} Returns a Promise that resolves to an object of type {@link epubloader.EpubManifest}
 */
function loadEpub(filePath){
    var promise = new Promise(function(resolve,reject){
        //the step by step

        //extract META-INF/container.xml from the targeted filepath
        //send the extracted xml off to a processor that returns the archive path of content.opf
        containerXML(filePath).then(
            function(opfPath){
                //extract the content.opf
                contentOPF(filePath, opfPath).then(
                    function(contentManifest){
                        console.log("manifest generated, basic epub loading process complete");
                        resolve(contentManifest);
                    },
                    function(err){
                        reject(err);
                    }
                )
            },
            function(err){
                reject(err);
            });

        //send the extracted content.opf content to a processor that returns the content manifest, table of contents, and epub metadata

        //resolve all information back to caller
    });

    return promise;
}

function containerXML(archive){
    var promise = new Promise(function(resolve,reject){
        lib7z.extract.file.toMemory({
            archpath: archive,
            filepath: 'META-INF/container.xml',
            reqname: 'containerxml',
            //verbose: true
        })
        .then(
            function(response){
                console.log('resolving opf manifest location');
                //xmlParser(response.files[0].buffer,function(err, result){
                xmlParser(response.data, function(err, result){
                    console.log(result);
                    result.container.rootfiles.forEach(function(item){
                        item.rootfile.forEach(function(itemitem){
                            if(path.extname(itemitem.$["full-path"]).toLowerCase() == '.opf'){
                                resolve(itemitem.$["full-path"]);
                            }
                        })
                    })
                })
            },
            function(error){
                console.error("7z error")
                reject(error);
            }
        );
    });

    return promise;
}

function contentOPF(archivePath, opfPath){
    var promise = new Promise(function(resolve,reject){
        lib7z.extract.file.toMemory({
            archpath: archivePath,
            filepath: opfPath,
            reqname: 'contentopf'
        })
        .then(
            function(response){
                //xmlParser(response.files[0].buffer, function(err, result){
                xmlParser(response.data, function(err, result){
                    //console.log(JSON.stringify(result));
                    console.log("generating manifest");
                    var processedManifest = opfProcess.processManifest(result, path.dirname(opfPath));
                    resolve(processedManifest);
                })
            },
            function(error){
                console.error("7z error")
                reject(error);
            }
        );
    });

    return promise;
}

module.exports = {
    loadEpub: loadEpub
}
