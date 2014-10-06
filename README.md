# JSONedit

User friendly, visual JSON editor built as an AngularJS directive. Provides a basic GUI to edit JSON.

**[Give it a try!](http://mb21.github.io/JSONedit)**

#### Use as Angular module

    $ bower install json-edit

```javascript
// require module in your app:
var app = angular.module('exampleApp', ['JSONedit']);
```

```html
<!-- use somewhere in your template -->
<div class="jsonView">
    <json child="myJson" default-collapsed="false" type="object"></json>
</div>

<!-- include JSONedit files -->
<script src="bower_components/JSONedit/js/directives.js"></script>
<link  href="bower_components/JSONedit/css/styles.css" rel="stylesheet" type="text/css" />

<!-- include the dependencies in this order (if you don't already have them) -->
<script src="bower_components/JSONedit/bower_components/jquery/dist/jquery.min.js"></script>
<script src="bower_components/JSONedit/bower_components/jquery-ui/jquery-ui.min.js"></script>
<script src="bower_components/JSONedit/bower_components/angular/angular.min.js"></script>
<script src="bower_components/JSONedit/bower_components/angular-ui-sortable/sortable.min.js"></script>
<link  href="bower_components/JSONedit/bower_components/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
```
