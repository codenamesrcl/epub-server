var server = require('./lib/server'),
    epubLoader = require('./lib/epubLoader');

/**
 * Known limitations
 *  - can only operate on one server at a time, the epubloader is not instance based
 *      - this is acceptable for the current needs of the library, it's easy enough to provide the epubserver
 *        library as an instance based server provider
 */

/**
 * Request a new epub to be loaded for viewing
 * @param  {string} filepath The absolute filepath to the epub to load
 * @return {object} A Promise for when the book is ready to be loaded via iframe.  The promise resolves to an object of type {@link epubserver.ServerInfo}
 */
function requestBook(filepath, portseed){
    var promise = new Promise(function(resolve, reject){
        epubLoader.loadEpub(filepath).then(
            function(epubManifest){
                //load the server now
                server.startServer(portseed, filepath, epubManifest).then(
                    function(serverInfo){
                        resolve(serverInfo);
                    },
                    function(err){
                        reject(err);
                    }
                );
            },
            function(err){
                reject(err);
            });
    })

    return promise;
}

module.exports = {
    requestBook: requestBook
}
