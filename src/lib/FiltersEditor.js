import React, {
  Component,
  PropTypes,
} from 'react'

import {
  fromJS,
  Map,
} from 'immutable'

import {
  Editor,
  Modifier,
  Entity,
  EditorState,
  SelectionState,
} from 'draft-js'

import * as util from './util/FiltersDraft'

export default class FiltersEditor extends Component {

  static propTypes = {
    filters: PropTypes.arrayOf(
      PropTypes.shape({
        category: PropTypes.string.isRequired,
        operator: PropTypes.string,
        option: PropTypes.string,
      })
    ).isRequired,
    onFiltersChange: PropTypes.func.isRequired,
  };

  state = {
    editorState: util.createEditorStateFromFilters(this.props.filters),
  };

  handlePublishEditorStateToFilters = this.publishEditorStateToFilters.bind(this);
  onChange = (nextEditorState) => {
    let isFilterEntityRemoved;
    this.setState(state => {
      const editorStateResult = this.getNextEditorState(state.editorState, nextEditorState);
      isFilterEntityRemoved = editorStateResult.isFilterEntityRemoved;
      return {
        editorState: editorStateResult.nextEditorState,
      };
    }, () => {
      if (isFilterEntityRemoved) {
        this.handlePublishEditorStateToFilters();
      }
    });
  };
  onUpdateSelectionState = (prevEntityKey, text, textEntityType) => {
    this.setState(state => ({
      editorState: this.updateSelectionFromAutoComplete(
        state.editorState,
        prevEntityKey,
        text,
        textEntityType
      ),
    }), this.handlePublishEditorStateToFilters)
  };

  getNextEditorState(prevEditorState, nextEditorState) {
    const prevFirstBlock = prevEditorState.getCurrentContent().getFirstBlock();
    const nextFirstBlock = nextEditorState.getCurrentContent().getFirstBlock();
    //
    const prevSelection = prevEditorState.getSelection();
    let prevEntityKey = (
      prevFirstBlock.getLength() > 0 ?
      prevFirstBlock.getEntityAt(prevSelection.getEndOffset() - 1) :
      null
    );
    let expectingEntityType = 'AUTOCOMPLETE_CATEGORIES'
    if (prevEntityKey) {
      const prevEntityType = Entity.get(prevEntityKey).getType();
      expectingEntityType = util.getNextEntityType(prevEntityType);
      //
      let found = false;
      nextFirstBlock.findEntityRanges(
        character => character.getEntity() === prevEntityKey,
        () => { found = true }
      );
      if (!found) {
        // Entity was removed, so we need to delete data
        Entity.replaceData(prevEntityKey, {});
        prevEntityKey = null;
      }
    } else {
      expectingEntityType = 'AUTOCOMPLETE_CATEGORIES';
    }
    //
    if (prevFirstBlock.getLength() >= nextFirstBlock.getLength()) {
      const isFilterEntityRemoved = (
        util.getFilterEntitiesCount(prevFirstBlock) > util.getFilterEntitiesCount(nextFirstBlock)
      );
      return {
        isFilterEntityRemoved,
        nextEditorState,
      };
    } else if (prevEntityKey && Entity.get(prevEntityKey).getType() === expectingEntityType) {
      return {
        isFilterEntityRemoved: false,
        nextEditorState,
      };
    } else {
      const nextSelection = nextEditorState.getSelection();
      //
      const nextEntityKey = Entity.create(expectingEntityType, 'MUTABLE', {
        onUpdateSelection: this.onUpdateSelectionState,
      });
      const nextContentState = Modifier.applyEntity(
        nextEditorState.getCurrentContent(),
        SelectionState
          .createEmpty(nextFirstBlock.getKey())
          .set('anchorOffset', prevSelection.getStartOffset())
          .set('focusOffset', nextSelection.getEndOffset()),
        nextEntityKey
      );
      return {
        isFilterEntityRemoved: false,
        nextEditorState: EditorState.forceSelection(
          EditorState.push(
            nextEditorState,
            nextContentState,
            'apply-entity'
          ),
          SelectionState
            .createEmpty(nextFirstBlock.getKey())
            .set('anchorOffset', nextSelection.getEndOffset())
            .set('focusOffset', nextSelection.getEndOffset())
        ),
      };
    }
  }

  updateSelectionFromAutoComplete(prevEditorState, prevEntityKey, text, textEntityType) {
    const prevContentState = prevEditorState.getCurrentContent();
    const prevFirstBlock = prevContentState.getFirstBlock();
    let rangeToReplace;
    //
    prevFirstBlock.findEntityRanges(
      character => character.getEntity() === prevEntityKey,
      (start, end) => {
        rangeToReplace = SelectionState
          .createEmpty(prevFirstBlock.getKey())
          .set('anchorOffset', start)
          .set('focusOffset', end);
      }
    );
    const nextEntityKey = Entity.create(textEntityType, 'IMMUTABLE', {
      text,
    });
    const nextContentState = Modifier.replaceText(
      prevContentState,
      rangeToReplace,
      text,
      null,
      nextEntityKey
    );
    return EditorState.push(
      prevEditorState,
      nextContentState,
      'apply-entity'
    );
  }

  getFiltersFromEditorState(editorState) {
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
        operator: (entities.get(1) || util.NullEntity).getData().text,
        option: (entities.get(2) || util.NullEntity).getData().text,
      }));
  }

  publishEditorStateToFilters() {
    const filters = this.getFiltersFromEditorState(this.state.editorState).toJS();
    this.props.onFiltersChange(filters);
  }

  componentWillReceiveProps(nextProps) {
    const nextFiltersFromProps = fromJS(nextProps.filters);
    const nextFiltersFromState = this.getFiltersFromEditorState(this.state.editorState)

    const isFiltersMatch = nextFiltersFromProps.equals(nextFiltersFromState);
    if (!isFiltersMatch) {
      this.setState({
        editorState: util.createEditorStateFromFilters(nextProps.filters),
      });
    }
  }

  render() {
    const editorProps = Map(this.props)
      .withMutations(map =>
        map
          .delete('filters')
          .delete('onFiltersChange')
          .set('editorState', this.state.editorState)
          .set('onChange', this.onChange)
      )
      .toObject()

    return React.createElement(Editor, editorProps);
  }
}
