import React, {
  PropTypes
} from 'react'

import {
  fromJS,
} from 'immutable'

import {
  Modifier,
  Entity,
  EditorState,
  ContentState,
  SelectionState,
  CompositeDecorator,
} from 'draft-js'

function getContentState(filters, onRender) {
  let contentState = ContentState.createFromText(
    filters.map(({ category, operator='', option='' }) => (
      `${category}${operator}${option}`
    )).join(' ')
  );
  const contentBlock = contentState.getFirstBlock();
  //
  let anchorOffset = 0;
  let focusOffset = 0;
  filters.forEach(({ category, operator='', option='' }) => {
    [
      [Category.entityType, category],
      [Operator.entityType, operator],
      [Option.entityType, option]
    ].forEach(([entityType, it]) => {
      if (!it) {
        return;
      }
      anchorOffset = focusOffset;
      focusOffset += it.length;

      const selectionState = SelectionState
        .createEmpty(contentBlock.getKey())
        .set('anchorOffset', anchorOffset)
        .set('focusOffset', focusOffset);

      contentState = Modifier.applyEntity(
        contentState,
        selectionState,
        Entity.create(entityType, 'IMMUTABLE', {
          onRender,
          text: it,
        })
      );
    });

    anchorOffset += 1;
    focusOffset += 1;
  });
  return contentState;
}

function makeComponent({ displayName, componentType, entityType }) {
  function Component({ entityKey, children }) {
    const { onRender } = Entity.get(entityKey).getData();
    return onRender(componentType, {
      children,
    });
  };
  Component.displayName = displayName;
  Component.componentType = componentType;
  Component.entityType = entityType;
  Component.propTypes = {
    entityKey: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };
  return Component;
}

const Category = makeComponent({
  displayName: 'Category',
  componentType: 'category',
  entityType: 'CATEGORY',
});

const Operator = makeComponent({
  displayName: 'Operator',
  componentType: 'operator',
  entityType: 'OPERATOR',
});

const Option = makeComponent({
  displayName: 'Option',
  componentType: 'option',
  entityType: 'OPTION',
});

export const filterPropTypesShape = PropTypes.shape({
  [Category.componentType]: PropTypes.string.isRequired,
  [Operator.componentType]: PropTypes.string,
  [Option.componentType]: PropTypes.string,
});

function makeAutocompleteComponent({ displayName, componentType, entityType, nextEntityType }) {
  function AutocompleteComponent({ entityKey, decoratedText: query, children }) {
    const { filter, onRender, onUpdateSelection } = Entity.get(entityKey).getData();
    const onSelect = text => {
      onUpdateSelection(entityKey, nextEntityType, text);
    };
    return onRender(componentType, {
      children,
      query,
      filter,
      onSelect,
    });
  };
  AutocompleteComponent.displayName = displayName;
  AutocompleteComponent.componentType = componentType;
  AutocompleteComponent.entityType = entityType;
  AutocompleteComponent.propTypes = {
    entityKey: PropTypes.string.isRequired,
    decoratedText: PropTypes.string.isRequired,
    filter: filterPropTypesShape,
    children: PropTypes.node.isRequired,
  };
  return AutocompleteComponent;
}

const AutocompleteCategories = makeAutocompleteComponent({
  displayName: 'AutocompleteCategories',
  componentType: 'autocompleteCategories',
  entityType: 'AUTOCOMPLETE_CATEGORIES',
  nextEntityType: Category.entityType,
});

const AutocompleteOperators = makeAutocompleteComponent({
  displayName: 'AutocompleteOperators',
  componentType: 'autocompleteOperators',
  entityType: 'AUTOCOMPLETE_OPERATORS',
  nextEntityType: Operator.entityType,
});

const AutocompleteOptions = makeAutocompleteComponent({
  displayName: 'AutocompleteOptions',
  componentType: 'autocompleteOptions',
  entityType: 'AUTOCOMPLETE_OPTIONS',
  nextEntityType: Option.entityType,
});

function makeStrategyForEntityType(entityType) {
  return (contentBlock, callback) => {
    contentBlock.findEntityRanges(
      (character) => {
        const entityKey = character.getEntity();
        return (
          entityKey !== null &&
          Entity.get(entityKey).getType() === entityType
        );
      },
      callback
    );
  }
}

function getDecorator() {
  return new CompositeDecorator([
    {
      strategy: makeStrategyForEntityType(Category.entityType),
      component: Category,
    },
    {
      strategy: makeStrategyForEntityType(Operator.entityType),
      component: Operator,
    },
    {
      strategy: makeStrategyForEntityType(Option.entityType),
      component: Option,
    },
    {
      strategy: makeStrategyForEntityType(AutocompleteCategories.entityType),
      component: AutocompleteCategories,
    },
    {
      strategy: makeStrategyForEntityType(AutocompleteOperators.entityType),
      component: AutocompleteOperators,
    },
    {
      strategy: makeStrategyForEntityType(AutocompleteOptions.entityType),
      component: AutocompleteOptions,
    },
  ]);
}

export const componentByTypeMap = PropTypes.shape({
  [Category.componentType]: PropTypes.func.isRequired,
  [Operator.componentType]: PropTypes.func.isRequired,
  [Option.componentType]: PropTypes.func.isRequired,
  [AutocompleteCategories.componentType]: PropTypes.func.isRequired,
  [AutocompleteOperators.componentType]: PropTypes.func.isRequired,
  [AutocompleteOptions.componentType]: PropTypes.func.isRequired,
});

export function createEditorStateFromFilters(filters, onRender) {
  return EditorState.moveSelectionToEnd(
    EditorState.createWithContent(
      getContentState(filters, onRender),
      getDecorator()
    )
  );
}

const FILTER_ENTITY_TYPES = fromJS([
  Category.entityType,
  Operator.entityType,
  Option.entityType,
]);

export function getFilterEntitiesCount(contentBlock) {
  return contentBlock
    .getCharacterList()
    .map(character => character.getEntity())
    .filter(entityKey => entityKey !== null)
    .map(entityKey => Entity.get(entityKey).getType())
    .filter(entityType => FILTER_ENTITY_TYPES.includes(entityType))
    .count();
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

export function getFoundAndMatchedExpectingEntityType(prevFirstBlock, nextFirstBlock, prevSelection) {
  let prevEntityKey = (
    prevFirstBlock.getLength() > 0 ?
    prevFirstBlock.getEntityAt(prevSelection.getEndOffset() - 1) :
    null
  );
  let foundAndMatched = false;
  let expectingEntityType;
  if (prevEntityKey) {
    let found;
    nextFirstBlock.findEntityRanges(
      character => character.getEntity() === prevEntityKey,
      () => { found = true }
    );
    if (found) {
      const prevEntityType = Entity.get(prevEntityKey).getType();
      expectingEntityType = getNextEntityType(prevEntityType);
      foundAndMatched = prevEntityType === expectingEntityType;
    } else {
      // Entity was removed, so we need to delete data
      Entity.replaceData(prevEntityKey, {});
      prevEntityKey = null;
      expectingEntityType = AutocompleteCategories.entityType;
    }
  } else {
    expectingEntityType = AutocompleteCategories.entityType;
  }
  return {
    foundAndMatched,
    expectingEntityType
  };
}

export function getAssociateFilter(contentBlock, filters, targetAnchorOffset) {
  let anchorOffset = 0;
  let focusOffset = 0;
  return filters.reduce((acc, filter) => {
    if (acc) {
      return acc;
    }
    const { category, operator='', option='' } = filter;
    return [
      [Category.entityType, category],
      [Operator.entityType, operator],
      [Option.entityType, option]
    ].reduce((result, [entityType, it]) => {
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

const NullEntity = {
  getData() {
    return {
      text: ''
    };
  },
};

export function getFiltersFromEditorState(editorState) {
  return editorState
    .getCurrentContent()
    .getFirstBlock()
    .getCharacterList()
    .map(character => character.getEntity())
    .filter(it => it !== null)
    .toOrderedSet()
    .map(entityKey => Entity.get(entityKey))
    .groupBy(function grouper() {
      if (this.count === 3) {
        this.index += 1;
        this.count = 1;
      } else {
        this.count += 1;
      }
      return this.index;
    }, {
      index: 0,
      count: 0,
    })
    .valueSeq()
    .map(entities => entities.toIndexedSeq())
    .map(entities => fromJS({
      category: entities.get(0).getData().text,
      operator: (entities.get(1) || NullEntity).getData().text,
      option: (entities.get(2) || NullEntity).getData().text,
    }));
}
