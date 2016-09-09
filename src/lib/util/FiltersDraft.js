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

export function getContentState(filters) {
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
    [[FILTER_ENTITY_TYPE_CATEGOTY, category], [FILTER_ENTITY_TYPE_OPERATOR, operator], [FILTER_ENTITY_TYPE_OPTION, option]].forEach(([type, it]) => {
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
        Entity.create(type, 'IMMUTABLE', {
          text: it,
        })
      );
    });

    anchorOffset += 1;
    focusOffset += 1;
  });
  return contentState;
}

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

const Category = ({ entityKey, children }) => {
  const data = Entity.get(entityKey).getData();
  return (
    <span data={JSON.stringify(data)} style={{ border: '1px solid green' }}>
      {children}
    </span>
  );
}

Category.propTypes = {
  entityKey: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const Operator = ({ entityKey, children }) => {
  const data = Entity.get(entityKey).getData();
  return (
    <span data={JSON.stringify(data)} style={{ border: '1px solid red' }}>
      {children}
    </span>
  );
}

Operator.propTypes = {
  entityKey: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const Option = ({ entityKey, children }) => {
  const data = Entity.get(entityKey).getData();
  return (
    <span data={JSON.stringify(data)} style={{ border: '1px solid blue' }}>
      {children}
    </span>
  );
}

Option.propTypes = {
  entityKey: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const AutocompleteCategories = ({ entityKey, decoratedText: query, children }) => {
  const { onUpdateSelection } = Entity.get(entityKey).getData();
  const handleClick = text => event => {
    event.preventDefault();
    event.stopPropagation();
    onUpdateSelection(entityKey, text, FILTER_ENTITY_TYPE_CATEGOTY);
  };
  return (
    <span data-query={query} style={{ border: '5px solid green', position: 'relative' }}>
      {children}
      <ul style={{ position: 'absolute', top: '20px', left: '0' }} contentEditable={false}>
        <li onClick={handleClick('category a')}>category a</li>
        <li onClick={handleClick('category c')}>category c</li>
        <li onClick={handleClick('category b')}>category b</li>
      </ul>
    </span>
  );
}

AutocompleteCategories.propTypes = {
  entityKey: PropTypes.string.isRequired,
  decoratedText: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const AutocompleteOperators = ({ entityKey, decoratedText: query, children }) => {
  const { onUpdateSelection } = Entity.get(entityKey).getData();
  const handleClick = text => event => {
    event.preventDefault();
    event.stopPropagation();
    onUpdateSelection(entityKey, text, FILTER_ENTITY_TYPE_OPERATOR);
  };
  return (
    <span data-query={query} style={{ border: '5px solid red', position: 'relative' }}>
      {children}
      <ul style={{ position: 'absolute', top: '20px', left: '0' }} contentEditable={false}>
        <li onClick={handleClick('=')}>{'='}</li>
        <li onClick={handleClick('>=')}>{'>='}</li>
        <li onClick={handleClick('<=')}>{'<='}</li>
      </ul>
    </span>
  );
}

AutocompleteOperators.propTypes = {
  entityKey: PropTypes.string.isRequired,
  decoratedText: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

const AutocompleteOptions = ({ entityKey, decoratedText: query, children }) => {
  const { onUpdateSelection } = Entity.get(entityKey).getData();
  const handleClick = text => event => {
    event.preventDefault();
    event.stopPropagation();
    onUpdateSelection(entityKey, text, FILTER_ENTITY_TYPE_OPTION);
  };
  return (
    <span data-query={query} style={{ border: '5px solid blue', position: 'relative' }}>
      {children}
      <ul style={{ position: 'absolute', top: '20px', left: '0' }} contentEditable={false}>
        <li onClick={handleClick('option 1')}>option 1</li>
        <li onClick={handleClick('option 3')}>option 3</li>
        <li onClick={handleClick('option 2')}>option 2</li>
      </ul>
    </span>
  );
}

AutocompleteOptions.propTypes = {
  entityKey: PropTypes.string.isRequired,
  decoratedText: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

function getDecorator() {
  return new CompositeDecorator([
    {
      strategy: makeStrategyForEntityType(FILTER_ENTITY_TYPE_CATEGOTY),
      component: Category,
    },
    {
      strategy: makeStrategyForEntityType(FILTER_ENTITY_TYPE_OPERATOR),
      component: Operator,
    },
    {
      strategy: makeStrategyForEntityType(FILTER_ENTITY_TYPE_OPTION),
      component: Option,
    },
    {
      strategy: makeStrategyForEntityType(FILTER_ENTITY_TYPE_AUTOCOMPLETE_CATEGORIES),
      component: AutocompleteCategories,
    },
    {
      strategy: makeStrategyForEntityType(FILTER_ENTITY_TYPE_AUTOCOMPLETE_OPERATORS),
      component: AutocompleteOperators,
    },
    {
      strategy: makeStrategyForEntityType(FILTER_ENTITY_TYPE_AUTOCOMPLETE_OPTIONS),
      component: AutocompleteOptions,
    },
  ]);
}

export const NullEntity = {
  getData() {
    return {
      text: ''
    };
  },
};

export const FILTER_ENTITY_TYPE_AUTOCOMPLETE_CATEGORIES = 'AUTOCOMPLETE_CATEGORIES';
const FILTER_ENTITY_TYPE_AUTOCOMPLETE_OPERATORS = 'AUTOCOMPLETE_OPERATORS';
const FILTER_ENTITY_TYPE_AUTOCOMPLETE_OPTIONS = 'AUTOCOMPLETE_OPTION';

export function getNextEntityType(prevEntityType) {
  switch (prevEntityType) {
    case FILTER_ENTITY_TYPE_CATEGOTY:
      return FILTER_ENTITY_TYPE_AUTOCOMPLETE_OPERATORS;
    case FILTER_ENTITY_TYPE_OPERATOR:
      return FILTER_ENTITY_TYPE_AUTOCOMPLETE_OPTIONS;
    case FILTER_ENTITY_TYPE_OPTION:
      return FILTER_ENTITY_TYPE_AUTOCOMPLETE_CATEGORIES;
    default:
      return prevEntityType;
  }
}

export function createEditorStateFromFilters(filters) {
  return EditorState.moveSelectionToEnd(
    EditorState.createWithContent(
      getContentState(filters),
      getDecorator()
    )
  );
}

export function getFilterEntitiesCount(contentBlock) {
  return contentBlock
    .getCharacterList()
    .map(character => character.getEntity())
    .filter(entityKey => entityKey !== null)
    .map(entityKey => Entity.get(entityKey).getType())
    .filter(entityType => FILTER_ENTITY_TYPES.includes(entityType))
    .count();
}

const FILTER_ENTITY_TYPE_CATEGOTY = 'CATEGORY';
const FILTER_ENTITY_TYPE_OPERATOR = 'OPERATOR';
const FILTER_ENTITY_TYPE_OPTION = 'OPTION';

const FILTER_ENTITY_TYPES = fromJS([
  FILTER_ENTITY_TYPE_CATEGOTY,
  FILTER_ENTITY_TYPE_OPERATOR,
  FILTER_ENTITY_TYPE_OPTION,
]);
