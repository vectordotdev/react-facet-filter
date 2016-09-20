'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.componentByTypeMap = exports.filterPropTypesShape = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _PropTypes$shape, _PropTypes$shape2;

exports.createEditorStateFromFilters = createEditorStateFromFilters;
exports.getFilterEntitiesCount = getFilterEntitiesCount;
exports.getFoundAndMatchedExpectingEntityType = getFoundAndMatchedExpectingEntityType;
exports.getAssociateFilter = getAssociateFilter;
exports.getFiltersFromEditorState = getFiltersFromEditorState;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _immutable = require('immutable');

var _draftJs = require('draft-js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getContentState(filters, onRender) {
  var contentState = _draftJs.ContentState.createFromText(filters.map(function (_ref) {
    var category = _ref.category;
    var _ref$operator = _ref.operator;
    var operator = _ref$operator === undefined ? '' : _ref$operator;
    var _ref$option = _ref.option;
    var option = _ref$option === undefined ? '' : _ref$option;
    return '' + category + operator + option;
  }).join(' '));
  var contentBlock = contentState.getFirstBlock();
  //
  var anchorOffset = 0;
  var focusOffset = 0;
  filters.forEach(function (_ref2) {
    var category = _ref2.category;
    var _ref2$operator = _ref2.operator;
    var operator = _ref2$operator === undefined ? '' : _ref2$operator;
    var _ref2$option = _ref2.option;
    var option = _ref2$option === undefined ? '' : _ref2$option;

    [[Category.entityType, category], [Operator.entityType, operator], [Option.entityType, option]].forEach(function (_ref3) {
      var _ref4 = (0, _slicedToArray3.default)(_ref3, 2);

      var entityType = _ref4[0];
      var it = _ref4[1];

      if (!it) {
        return;
      }
      anchorOffset = focusOffset;
      focusOffset += it.length;

      var selectionState = _draftJs.SelectionState.createEmpty(contentBlock.getKey()).set('anchorOffset', anchorOffset).set('focusOffset', focusOffset);

      contentState = _draftJs.Modifier.applyEntity(contentState, selectionState, _draftJs.Entity.create(entityType, 'IMMUTABLE', {
        onRender: onRender,
        text: it
      }));
    });

    anchorOffset += 1;
    focusOffset += 1;
  });
  return contentState;
}

function makeComponent(_ref5) {
  var displayName = _ref5.displayName;
  var componentType = _ref5.componentType;
  var entityType = _ref5.entityType;

  function Component(_ref6) {
    var entityKey = _ref6.entityKey;
    var children = _ref6.children;

    var _Entity$get$getData = _draftJs.Entity.get(entityKey).getData();

    var onRender = _Entity$get$getData.onRender;

    return onRender(componentType, {
      children: children
    });
  };
  Component.displayName = displayName;
  Component.componentType = componentType;
  Component.entityType = entityType;
  Component.propTypes = {
    entityKey: _react.PropTypes.string.isRequired,
    children: _react.PropTypes.node.isRequired
  };
  return Component;
}

var Category = makeComponent({
  displayName: 'Category',
  componentType: 'category',
  entityType: 'CATEGORY'
});

var Operator = makeComponent({
  displayName: 'Operator',
  componentType: 'operator',
  entityType: 'OPERATOR'
});

var Option = makeComponent({
  displayName: 'Option',
  componentType: 'option',
  entityType: 'OPTION'
});

var filterPropTypesShape = exports.filterPropTypesShape = _react.PropTypes.shape((_PropTypes$shape = {}, (0, _defineProperty3.default)(_PropTypes$shape, Category.componentType, _react.PropTypes.string.isRequired), (0, _defineProperty3.default)(_PropTypes$shape, Operator.componentType, _react.PropTypes.string), (0, _defineProperty3.default)(_PropTypes$shape, Option.componentType, _react.PropTypes.string), _PropTypes$shape));

function makeAutocompleteComponent(_ref7) {
  var displayName = _ref7.displayName;
  var componentType = _ref7.componentType;
  var entityType = _ref7.entityType;
  var nextEntityType = _ref7.nextEntityType;

  function AutocompleteComponent(_ref8) {
    var entityKey = _ref8.entityKey;
    var query = _ref8.decoratedText;
    var children = _ref8.children;

    var _Entity$get$getData2 = _draftJs.Entity.get(entityKey).getData();

    var filter = _Entity$get$getData2.filter;
    var onRender = _Entity$get$getData2.onRender;
    var onUpdateSelection = _Entity$get$getData2.onUpdateSelection;

    var onSelect = function onSelect(text) {
      onUpdateSelection(entityKey, nextEntityType, text);
    };
    return onRender(componentType, {
      children: children,
      query: query,
      filter: filter,
      onSelect: onSelect
    });
  };
  AutocompleteComponent.displayName = displayName;
  AutocompleteComponent.componentType = componentType;
  AutocompleteComponent.entityType = entityType;
  AutocompleteComponent.propTypes = {
    entityKey: _react.PropTypes.string.isRequired,
    decoratedText: _react.PropTypes.string.isRequired,
    filter: filterPropTypesShape,
    children: _react.PropTypes.node.isRequired
  };
  return AutocompleteComponent;
}

var AutocompleteCategories = makeAutocompleteComponent({
  displayName: 'AutocompleteCategories',
  componentType: 'autocompleteCategories',
  entityType: 'AUTOCOMPLETE_CATEGORIES',
  nextEntityType: Category.entityType
});

var AutocompleteOperators = makeAutocompleteComponent({
  displayName: 'AutocompleteOperators',
  componentType: 'autocompleteOperators',
  entityType: 'AUTOCOMPLETE_OPERATORS',
  nextEntityType: Operator.entityType
});

var AutocompleteOptions = makeAutocompleteComponent({
  displayName: 'AutocompleteOptions',
  componentType: 'autocompleteOptions',
  entityType: 'AUTOCOMPLETE_OPTIONS',
  nextEntityType: Option.entityType
});

function makeStrategyForEntityType(entityType) {
  return function (contentBlock, callback) {
    contentBlock.findEntityRanges(function (character) {
      var entityKey = character.getEntity();
      return entityKey !== null && _draftJs.Entity.get(entityKey).getType() === entityType;
    }, callback);
  };
}

function getDecorator() {
  return new _draftJs.CompositeDecorator([{
    strategy: makeStrategyForEntityType(Category.entityType),
    component: Category
  }, {
    strategy: makeStrategyForEntityType(Operator.entityType),
    component: Operator
  }, {
    strategy: makeStrategyForEntityType(Option.entityType),
    component: Option
  }, {
    strategy: makeStrategyForEntityType(AutocompleteCategories.entityType),
    component: AutocompleteCategories
  }, {
    strategy: makeStrategyForEntityType(AutocompleteOperators.entityType),
    component: AutocompleteOperators
  }, {
    strategy: makeStrategyForEntityType(AutocompleteOptions.entityType),
    component: AutocompleteOptions
  }]);
}

var componentByTypeMap = exports.componentByTypeMap = _react.PropTypes.shape((_PropTypes$shape2 = {}, (0, _defineProperty3.default)(_PropTypes$shape2, Category.componentType, _react.PropTypes.func.isRequired), (0, _defineProperty3.default)(_PropTypes$shape2, Operator.componentType, _react.PropTypes.func.isRequired), (0, _defineProperty3.default)(_PropTypes$shape2, Option.componentType, _react.PropTypes.func.isRequired), (0, _defineProperty3.default)(_PropTypes$shape2, AutocompleteCategories.componentType, _react.PropTypes.func.isRequired), (0, _defineProperty3.default)(_PropTypes$shape2, AutocompleteOperators.componentType, _react.PropTypes.func.isRequired), (0, _defineProperty3.default)(_PropTypes$shape2, AutocompleteOptions.componentType, _react.PropTypes.func.isRequired), _PropTypes$shape2));

function createEditorStateFromFilters(filters, onRender) {
  return _draftJs.EditorState.moveSelectionToEnd(_draftJs.EditorState.createWithContent(getContentState(filters, onRender), getDecorator()));
}

var FILTER_ENTITY_TYPES = (0, _immutable.fromJS)([Category.entityType, Operator.entityType, Option.entityType]);

function getFilterEntitiesCount(contentBlock) {
  return contentBlock.getCharacterList().map(function (character) {
    return character.getEntity();
  }).filter(function (entityKey) {
    return entityKey !== null;
  }).map(function (entityKey) {
    return _draftJs.Entity.get(entityKey).getType();
  }).filter(function (entityType) {
    return FILTER_ENTITY_TYPES.includes(entityType);
  }).count();
}

function getNextEntityType(prevEntityType) {
  switch (prevEntityType) {
    case Category.entityType:
      return AutocompleteOperators.entityType;
    case Operator.entityType:
      return AutocompleteOptions.entityType;
    case Option.entityType:
      return AutocompleteCategories.entityType;
    default:
      return prevEntityType;
  }
}

function getFoundAndMatchedExpectingEntityType(prevFirstBlock, nextFirstBlock, prevSelection) {
  var prevEntityKey = prevFirstBlock.getLength() > 0 ? prevFirstBlock.getEntityAt(prevSelection.getEndOffset() - 1) : null;
  var foundAndMatched = false;
  var expectingEntityType = void 0;
  if (prevEntityKey) {
    var found = void 0;
    nextFirstBlock.findEntityRanges(function (character) {
      return character.getEntity() === prevEntityKey;
    }, function () {
      found = true;
    });
    if (found) {
      var prevEntityType = _draftJs.Entity.get(prevEntityKey).getType();
      expectingEntityType = getNextEntityType(prevEntityType);
      foundAndMatched = prevEntityType === expectingEntityType;
    } else {
      // Entity was removed, so we need to delete data
      _draftJs.Entity.replaceData(prevEntityKey, {});
      prevEntityKey = null;
      expectingEntityType = AutocompleteCategories.entityType;
    }
  } else {
    expectingEntityType = AutocompleteCategories.entityType;
  }
  return {
    foundAndMatched: foundAndMatched,
    expectingEntityType: expectingEntityType
  };
}

function getAssociateFilter(contentBlock, filters, targetAnchorOffset) {
  var anchorOffset = 0;
  var focusOffset = 0;
  return filters.reduce(function (acc, filter) {
    if (acc) {
      return acc;
    }
    var category = filter.category;
    var _filter$operator = filter.operator;
    var operator = _filter$operator === undefined ? '' : _filter$operator;
    var _filter$option = filter.option;
    var option = _filter$option === undefined ? '' : _filter$option;

    return [[Category.entityType, category], [Operator.entityType, operator], [Option.entityType, option]].reduce(function (result, _ref9) {
      var _ref10 = (0, _slicedToArray3.default)(_ref9, 2);

      var entityType = _ref10[0];
      var it = _ref10[1];

      if (result || !it) {
        return result;
      }
      anchorOffset = focusOffset;
      focusOffset += it.length;

      if (anchorOffset <= targetAnchorOffset && targetAnchorOffset <= focusOffset) {
        return filter;
      }
    }, null);
  }, null);
}

var NullEntity = {
  getData: function getData() {
    return {
      text: ''
    };
  }
};

function filterWithDefaults(filter) {
  return (0, _immutable.Map)({
    category: '',
    operator: '',
    option: ''
  }).merge(filter);
}

function getFiltersFromEditorState(editorState) {
  return editorState.getCurrentContent().getFirstBlock().getCharacterList().map(function (character) {
    return character.getEntity();
  }).filter(function (it) {
    return it !== null;
  }).toOrderedSet().map(function (entityKey) {
    return _draftJs.Entity.get(entityKey);
  }).reduce(function (accList, entity) {
    return [Category, Operator, Option].reduce(function (list, _ref11) {
      var entityType = _ref11.entityType;
      var componentType = _ref11.componentType;

      var targetEntityType = entity.getType();
      if (targetEntityType === entityType) {
        var lastFilter = list.last();
        if (!lastFilter) {
          lastFilter = (0, _immutable.Map)();
        }
        if (lastFilter.has(componentType)) {
          // touched new filter
          list = list.push(filterWithDefaults(lastFilter));
          lastFilter = (0, _immutable.Map)();
        }
        var text = entity.getData().text;
        lastFilter = lastFilter.set(componentType, text);
        return list.set(-1, lastFilter);
      }
      return list;
    }, accList);
  }, (0, _immutable.List)());
}