/**
 * Contains the server info of the instantiated and started epub server
 * @class {object} epubServer.ServerInfo
 * @param {int} port The port number of the active server
 * @param {object} manifest The epub manifest of type {@link EpubManifest}
 */
function ServerInfo(port, manifest){
    this.port = port || null;
    this.manifest = manifest || (new EpubManifest());
}

/**
 * Contains the epub table of contents, content manifest, and metadata related to an epub
 * @class {object} epubServer.EpubManifest
 */
function EpubManifest(){
    this.metadata = [];
    this.spine = [];
    this.manifest = [];
    this.guide = [];
    this.contentBasePath = '';
}


module.exports = {
    EpubManifest: function(){ return new EpubManifest() },
    ServerInfo: function(port, manifest){return new ServerInfo(port, manifest) }
}
