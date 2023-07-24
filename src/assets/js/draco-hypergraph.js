var dracoHypergraph = function (links, nodes) {
    var obj;
    var hyper = [];
    var i;
    var j;
    var k;
    links.map(link => link.ids).forEach((d,l_i) => {
        //if link length >2 there's an Hyperlink: i need to create a connection node
        if (d.length >= 2) {
            //connection node id creation
            var id = 'ln-' + links[l_i].feature_id + '-'; // FACED ISSUE => distinction of link nodes with identical nodes
            for (k = 0; k < d.length; k++) {
                id += d[k];
            }
            //connection node creation
            i = { ...links[l_i], id: id, link: true};
            //add the connection node to the node array
            nodes.push(i);
            //creation of the link from every node of the connection set to the connection node
            for (j = 0; j < d.length; j++) {
                hyper.push({ source: d[j], target: i.id });
            }
        } else {
            //if link < 2 then the connection is the traditional one w/o connection node
            hyper.push({ source: d[0], target: d[1] });
        }
    });

    var obj = { links: hyper, nodes: nodes };
    return obj;
}
export default dracoHypergraph;