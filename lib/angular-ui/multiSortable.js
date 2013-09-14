/**
  Angular directive for JQuery UI sortable.
  Built on angular-ui "uiSortable" directive.
  Adds ability to sort between multiple sortables.

  @author: Michal Ostruszka (http://michalostruszka.pl)
**/

angular.module('ui.directives').directive('uiMultiSortable', ['ui.config', '$parse', function(uiConfig, $parse) {
    var options = {};
    if (uiConfig.sortable !== null) {
      angular.extend(options, uiConfig.sortable);
    }

    var ModelSynchronizer = function(uiElement, attrs) {
      var MODEL_SUBSET_ATTR = 'ui-sortable-model-subset';
      var INITIAL_POSITION_ATTR = 'ui-sortable-start-pos';
      var self = this;

      // Set some data-* attributes on element being sorted just before sorting starts
      this.appendDataOnStart = function() {
        uiElement.item.data(INITIAL_POSITION_ATTR, uiElement.item.index());
        uiElement.item.data(MODEL_SUBSET_ATTR, attrs.modelSubset);
      };

      // Update underlying model when elements sorted within one "sortable"
      this.updateSingleSortableModel = function(model) {
        _collectDataRequiredForModelSync();
        if(_isInternalUpdate() && _hasPositionChanged()) {
          _update(model);
        }
      };

      // Update underlying model when elements sorted between different "sortables"
      this.updateMultiSortableModel = function(model) {
        _collectDataRequiredForModelSync();
        _update(model);
      };

      function _collectDataRequiredForModelSync() {
        self.data = {
          origSubset: uiElement.item.data(MODEL_SUBSET_ATTR),
          destSubset: attrs.modelSubset,
          origPosition: uiElement.item.data(INITIAL_POSITION_ATTR),
          destPosition: uiElement.item.index()
        };
      }

      function _hasPositionChanged() {
        return (self.data.origPosition !== self.data.destPosition) || !_isInternalUpdate();
      }

      function _isInternalUpdate() {
        return attrs.modelSubset === undefined || self.data.origSubset === self.data.destSubset;
      }

      function _update(model) {
        if(attrs.modelSubset === undefined) {
          model.splice(self.data.destPosition, 0, model.splice(self.data.origPosition, 1)[0]);
        } else {
          ($parse(self.data.destSubset)(model)).splice(self.data.destPosition, 0, ($parse(self.data.origSubset)(model)).splice(self.data.origPosition, 1)[0]);
        }
      }
    };

    return {
      require: '?ngModel',
      link: function(scope, element, attrs, ngModel) {
        var opts = angular.extend({}, options, scope.$eval(attrs.uiOptions));
        if (ngModel !== null) {
          var _start = opts.start;
          opts.start = function(e, ui) {
            new ModelSynchronizer(ui, attrs).appendDataOnStart();
            _callUserDefinedCallback(_start)(e, ui);
            return scope.$apply();
          };

          var _update = opts.update;
          opts.update = function(e, ui) {
            _callUserDefinedCallback(_update)(e, ui);
            return scope.$apply();
          };

          var _stop = opts.stop;
          opts.stop = function(e, ui) {
            var modelSync = new ModelSynchronizer(ui, attrs);
            modelSync.updateSingleSortableModel(ngModel.$modelValue);
            _callUserDefinedCallback(_stop)(e, ui);
            return scope.$apply();
          };

          var _receive = opts.receive;
          opts.receive = function(e, ui) {
            var modelSync = new ModelSynchronizer(ui, attrs);
            modelSync.updateMultiSortableModel(ngModel.$modelValue);
            _callUserDefinedCallback(_receive)(e, ui);
            return scope.$apply();
          };
        }
        function _callUserDefinedCallback(callback) {
          if (typeof callback === "function") {
            return callback; // regular callback
          }
          if(typeof scope[callback] === "function") {
            return scope[callback]; // $scope function as callback
          }
          return function() {}; // noop function
        }
        return element.sortable(opts);
      }
    };
  }
]);