var hierarchy = {
    init: function () {
        if (!localStorage.getItem('id_counter') || !parseInt(localStorage.getItem('id_counter'))) {
            localStorage.setItem('id_counter', 0)
        }
        if (!this.getById(0)) {
            var node = new Node();
            node.id = 0;
            localStorage.setItem(node.id, JSON.stringify(node));
        }
        this.populateGlobalTable();
    },
    incr: function () {
        var id = parseInt(localStorage.getItem('id_counter')) + 1;
        localStorage.setItem('id_counter', id);
        return id;
    },
    insert: function (node) {
        if (!(node instanceof Node)) {
            return;
        }
        node.id = this.incr();
        localStorage.setItem(node.id, JSON.stringify(node));
        this._updateParent(node);
    },
    update: function (node) {
        if (!(node instanceof Node)) {
            return;
        }
        localStorage.setItem(node.id, JSON.stringify(node));
        this._updateParent(node);
    },
    _updateParent: function (node) {
        var parent = this.getById(node.parent_id);
        if (parent && (node.id != parent.id) && (parent.children.indexOf(node.id) == -1)) {
            parent.children.push(node.id);
            this.update(parent);
        }
    },
    getById: function (id) {
        var obj = null,
            node = new Node();
        try{
            obj = JSON.parse(localStorage.getItem(id));
        }catch (ex){
            console.log(ex);
        }
        if ((obj !== undefined) && (obj !== null)) {
            node.id = obj.id;
            node.name = obj.name;
            node.description = obj.description;
            node.children = obj.children;
            return node;
        }
        return null;
    },
    populateGlobalTable: function () {
        this.populateTable($('#globalTable'), 0);
    },
    populateTable: function ($table, _parent_id) {
        if (!$table || ($table.length <= 0)) return;
        var parent_id = _parent_id ? _parent_id : 0,
            parent = this.getById(parent_id);
        if (!(parent instanceof Node)) {
            $table.find('> tbody').html('');
            return;
        }
        var children = parent.getChildren(),
            html = '';
        $(children).each(function (index, node) {
            html +=
                '<tr><td>' + node.id + '</td>'
                    + '<td>' + node.name + '</td>'
                    + '<td>' + node.description + '</td>'
                    + '<td>' + JSON.stringify(node.children) + '</td></tr>'
            ;
        });
        $table.find('> tbody').html(html);
    },
    saveStorage: function () {
        var keys = Object.keys(localStorage),
            res = {},
            json;
        $(keys).each(function (i, key) {
            res[key] = localStorage.getItem(key);
        });
        json = JSON.stringify(res);
        var blob = new Blob([json], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "localStorage.txt");
    },
    clearStorage: function(){
        localStorage.clear();
        this.init();
    },
    loadStorage: function (evt) {
        var files = evt.target.files; // FileList object

        // Loop through the FileList and render image files as thumbnails.
        for (var i = 0, f; f = files[i]; i++) {

            // Only process text files.
            if (!f.type.match('text/plain')) {
                continue;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    console.log(e.target.result);
                    try{
                        var obj = JSON.parse(e.target.result);
                        hierarchy.clearStorage();
                        $.each(obj, function(index, val){
                            localStorage.setItem(index, val);
                        });
                        hierarchy.populateGlobalTable();
                    }catch (ex){
                        console.log(ex);
                    }
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    }
};

Node = function () {
    this.parent_id = 0;
    this.name = '';
    this.description = '';
    this.children = [];
};

Node.prototype.getChildren = function () {
    var i = 0,
        length = this.children.length,
        childrenArr = [];
    for (i; i < length; i++) {
        childrenArr.push(this.getChild(this.children[i]));
    }
    return childrenArr;
};

Node.prototype.getChild = function (id) {
    if (this.children.indexOf(id) > -1) {
        return hierarchy.getById(id);
    }
    return null;
};

$(document).ready(function () {
    hierarchy.init();
    $('.create-form').submit(function (e) {
        e.preventDefault();
        var node = new Node();
        node.name = $(this).find('.name').val();
        node.description = $(this).find('.description').val();
        node.parent_id = $(this).find('.parent-id').val();
        hierarchy.insert(node);
        hierarchy.populateGlobalTable();
    });

    $('#tableRootId').on('keyup',function (e) {
        if (e.which != 8 && isNaN(String.fromCharCode(e.which))) {
            e.preventDefault();
        }
    }).on('focusin',function () {
        $(this).val('');
    }).on('change', function () {
        hierarchy.populateTable($('#globalTable'), $(this).val());
    });

    $('#clearStorage').on('click', function () {
        if (confirm('Do you really want to clear local storage?')) {
            hierarchy.clearStorage();
        }
    });

    $('#saveStorage').on('click', function () {
        hierarchy.saveStorage();
    });

    $('#loadStorage').on('change', function (e) {
        hierarchy.loadStorage(e);
    });
});