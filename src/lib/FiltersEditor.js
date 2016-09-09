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
    componentByTypeMap: util.componentByTypeMap.isRequired,
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
  onRenderComponent = (componentType, props) => {
    const Component = this.props.componentByTypeMap[componentType];
    return React.createElement(Component, props);
  };
  onUpdateSelectionState = (prevEntityKey, textEntityType, text) => {
    this.setState(state => ({
      editorState: this.updateSelectionFromAutoComplete(
        state.editorState,
        prevEntityKey,
        textEntityType,
        text,
      ),
    }), this.handlePublishEditorStateToFilters)
  };

  getNextEditorState(prevEditorState, nextEditorState) {
    const prevFirstBlock = prevEditorState.getCurrentContent().getFirstBlock();
    const nextFirstBlock = nextEditorState.getCurrentContent().getFirstBlock();
    //
    if (prevFirstBlock.getLength() >= nextFirstBlock.getLength()) {
      const isFilterEntityRemoved = (
        util.getFilterEntitiesCount(prevFirstBlock) > util.getFilterEntitiesCount(nextFirstBlock)
      );
      return {
        isFilterEntityRemoved,
        nextEditorState,
      };
    }
    const prevSelection = prevEditorState.getSelection();
    const {
      foundAndMatched,
      expectingEntityType
    } = util.getFoundAndMatchedExpectingEntityType(
      prevFirstBlock,
      nextFirstBlock,
      prevSelection
    );
    if (foundAndMatched) {
      return {
        isFilterEntityRemoved: false,
        nextEditorState,
      };
    } else {
      const nextSelection = nextEditorState.getSelection();
      //
      const nextEntityKey = Entity.create(expectingEntityType, 'MUTABLE', {
        onRender: this.onRenderComponent,
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

  updateSelectionFromAutoComplete(prevEditorState, prevEntityKey, textEntityType, text) {
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
      onRender: this.onRenderComponent,
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

  publishEditorStateToFilters() {
    const filters = util.getFiltersFromEditorState(this.state.editorState).toJS();
    this.props.onFiltersChange(filters);
  }

  componentWillMount() {
    this.setState({
      editorState: util.createEditorStateFromFilters(this.props.filters, this.onRenderComponent),
    });
  }

  componentWillReceiveProps(nextProps) {
    const nextFiltersFromProps = fromJS(nextProps.filters);
    const nextFiltersFromState = util.getFiltersFromEditorState(this.state.editorState)

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
          .delete('componentByTypeMap')
          .set('editorState', this.state.editorState)
          .set('onChange', this.onChange)
      )
      .toObject()

    return React.createElement(Editor, editorProps);
  }
}
