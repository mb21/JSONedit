var app = angular.module('JSONedit', ['ui']);

// fix ui-multi-sortable to y-axis
app.value('ui.config', {
    "sortable": {
        "axis": "y",
        "placeholder": "sortable-placeholder"
    }
});

// override the default input to update on blur
// from http://jsfiddle.net/cn8VF/
app.directive('ngModelOnblur', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;
            
            elm.unbind('input').unbind('keydown').unbind('change');
            elm.bind('blur', function() {
                scope.$apply(function() {
                    ngModelCtrl.$setViewValue(elm.val());
                });         
            });
        }
    };
});

app.directive('json', function($compile, $timeout) {
  return {
    restrict: 'E',
    scope: {
      child: '=',
      type: '='
    },
    link: function(scope, element, attributes) {
        
        var stringName = "Text";
        var numberName = "Number";
        var objectName = "Object"; 
        var arrayName = "Array";

        scope.valueTypes = [stringName, numberName, objectName, arrayName];

        //////
        // Helper functions
        //////

        var getType = function(obj) {
            if(obj == null) return "String";

            var type = Object.prototype.toString.call(obj);
            if (type === "[object Object]") {
                return "Object";
            } else if(type === "[object Array]"){
                return "Array";
            } else if(type === "[object String]"){
                return "String";
            } else if(type === "[object Number]"){
                return "Number";
            } else {
                console.error("Can't determine object type");
                throw new Error("Can't determine object type");
            }
        };
        var isNumber = function(n) {
          return !isNaN(parseFloat(n)) && isFinite(n);
        };
        scope.getType = function(obj) {
            return getType(obj);
        };
        scope.toggleCollapse = function() {
            if (scope.collapsed) {
                scope.collapsed = false;
                scope.chevron = "icon-chevron-down";
            } else {
                scope.collapsed = true;
                scope.chevron = "icon-chevron-right";
            }
        };
        scope.moveKey = function(obj, key, newkey) {
            //moves key to newkey in obj
            obj[newkey] = obj[key];
            delete obj[key];
        };
        scope.deleteKey = function(obj, key) {
            if (getType(obj) == "Object") {
                if( confirm('Delete "'+key+'" and all it contains?') ) {
                    delete obj[key];
                }
            } else if (getType(obj) == "Array") {
                if( confirm('Delete "'+obj[key]+'"?') ) {
                    obj.splice(key, 1);
                }
            } else {
                console.error("object to delete from was " + obj);
            }
        };
        scope.addItem = function(obj) {
            if (getType(obj) == "Object") {
                // check input for key
                if (scope.keyName == undefined || scope.keyName.length == 0){
                    alert("Please fill in a name");
                } else if (scope.keyName.indexOf("$") == 0){
                    alert("The name may not start with $ (the dollar sign)");
                } else if (scope.keyName.indexOf("_") == 0){
                    alert("The name may not start with _ (the underscore)");
                } else {
                    if (obj[scope.keyName]) {
                        if( !confirm('An item with the name "'+scope.keyName
                            +'" exists already. Do you really want to replace it?') ) {
                            return;
                        }
                    }
                    // add item to object
                    switch(scope.valueType) {
                        case stringName: obj[scope.keyName] = scope.valueName || "";
                                        break;
                        case numberName: obj[scope.keyName] = parseFloat(scope.valueName) || 0;
                                        break;
                        case objectName:  obj[scope.keyName] = {};
                                        break;
                        case arrayName:   obj[scope.keyName] = [];
                                        break;
                    }
                    //clean-up
                    scope.keyName = "";
                    scope.valueName = "";
                    scope.showAddKey = false;
                }
            } else if (getType(obj) == "Array") {
                // add item to array
                switch(scope.valueType) {
                    case stringName: obj.push(scope.valueName ? scope.valueName : "");
                                    break;
                    case numberName: obj.push(parseFloat(scope.valueName) || 0);
                                    break;
                    case objectName:  obj.push({});
                                    break;
                    case arrayName:   obj.push([]);
                                    break;
                }
                scope.valueName = "";
                scope.showAddKey = false;
            } else {
                console.error("object to add to was " + obj);
            }
        };

        //////
        // Template Generation
        //////

        // Note:
        // sometimes having a different ng-model and then saving it on ng-change
        // into the object or array is necesarry for all updates to work
        
        // recursion
        var switchTemplate = 
            '<span ng-switch on="getType(val)" >'
                + '<json ng-switch-when="Object" child="val" type="\'object\'"></json>'
                + '<json ng-switch-when="Array" child="val" type="\'array\'"></json>'
                + '<span ng-switch-when="String" class="jsonLiteral"><input type="text" ng-model="val" placeholder="Empty" ng-model-onblur ng-change="child[key] = val" class="input-small"></span>'
                + '<span ng-switch-when="Number" class="jsonLiteral"><input type="number" ng-model="val" placeholder="Empty" ng-model-onblur ng-change="child[key] = parseFloat(val) || 0" class="input-small"></span>'
                + '<span ng-switch-default>hi</span>'
            + '</span>';
        
        // display either "plus button" or "key-value inputs"
        var addItemTemplate = 
        '<div ng-switch on="showAddKey" class="block" >'
            + '<span ng-switch-when="true">';
                if (scope.type == "object"){
                   // input key
                    addItemTemplate += '<input placeholder="Name" type="text" ui-keyup="{\'enter\':\'addItem(child)\'}" '
                        + 'class="input-small addItemKeyInput" ng-model="$parent.keyName" />';
                }
                addItemTemplate += 
                // value type dropdown
                '<select ng-model="$parent.valueType" ng-options="option for option in valueTypes"'
                    + 'ng-init="$parent.valueType=\''+stringName+'\'" ui-keydown="{\'enter\':\'addItem(child)\'}"></select>'
                // input value
                + '<span ng-show="$parent.valueType == \''+stringName+'\' || $parent.valueType == \''+numberName+'\'"> : <input type="text" placeholder="Value" '
                    + 'class="input-medium addItemValueInput" ng-model="$parent.valueName" ui-keyup="{\'enter\':\'addItem(child)\'}"/></span> '
                // Add button
                + '<button class="btn btn-primary" ng-click="addItem(child)">Add</button> '
                + '<button class="btn" ng-click="$parent.showAddKey=false">Cancel</button>'
            + '</span>'
            + '<span ng-switch-default>'
                // plus button
                + '<button class="addObjectItemBtn" ng-click="$parent.showAddKey = true"><i class="icon-plus"></i></button>'
            + '</span>'
        + '</div>';
    
        // start template
        if (scope.type == "object"){
            var template = '<i ng-click="toggleCollapse()" ng-class="chevron"'
            + ' ng-init="chevron = \'icon-chevron-down\'"></i>'
            + '<span class="jsonItemDesc">'+objectName+'</span>'
            + '<div class="jsonContents" ng-hide="collapsed">'
                // repeat
                + '<span class="block" ng-hide="key.indexOf(\'_\') == 0" ng-repeat="(key, val) in child">'
                    // object key
                    + '<span class="jsonObjectKey">'
                        + '<input class="keyinput" type="text" ng-model="newkey" ng-init="newkey=key" '
                            + 'ng-change="moveKey(child, key, newkey)"/>'
                        // delete button
                        + '<i class="deleteKeyBtn icon-trash" ng-click="deleteKey(child, key)"></i>'
                    + '</span>'
                    // object value
                    + '<span class="jsonObjectValue">' + switchTemplate + '</span>'
                + '</span>'
                // repeat end
                + addItemTemplate
            + '</div>';
        } else if (scope.type == "array") {
            var template = '<i ng-click="toggleCollapse()" ng-class="chevron" ng-init="chevron = \'icon-chevron-down\'"></i>'
            + '<span class="jsonItemDesc">'+arrayName+'</span>'
            + '<div class="jsonContents" ng-hide="collapsed">'
                + '<ol class="arrayOl" start="0" ui-multi-sortable ng-model="child">'
                    // repeat
                    + '<li class="arrayItem" ng-repeat="val in child" ng-init="key=$index">' //key needed in moveKey()
                        // delete button
                        + '<i class="deleteKeyBtn icon-trash" ng-click="deleteKey(child, $index)"></i>'
                        + '<i class="moveArrayItemBtn icon-align-justify"></i>'
                        + '<span>' + switchTemplate + '</span>'
                    + '</li>'
                    // repeat end
                + '</ol>'
                + addItemTemplate
            + '</div>';
        } else {
            console.error("scope.type was "+ scope.type);
        }

        var newElement = angular.element(template);
        $compile(newElement)(scope);
        element.replaceWith(newElement); 
    }
  };
});
