import React, { Component, PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import List from 'react-list-select';
import utils from './utils';

const KEY = {
  TAB: 9,
  ENTER: 13,
  ESC: 27,
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  DELETE: 46,
  SPACE: 32
};

const CHAR_WIDTH = 7;
//  +| Condition                  | Example                   |
//  +|----------------------------|---------------------------|
//  +| `begins with`              | `path.to.field:string*`   |
//  +| `contains`                 | `path.to.field:*string*`  |
//  +| `ends with`                | `path.to.field:*string`   |
//  +| `equals`                   | `path.to.field:string`    |
//  +| `greater than`             | `path.to.field>number`    |
//  +| `greater than or equal to` | `path.to.field>=number`   |
//  +| `has field`                | `has:path.to.field`       |
//  +| `less than`                | `path.to.field<number`    |
//  +| `less than or equal to`    | `path.to.field<=number`   |
//  +| `missing field`            | `missing:path.to.field`   |

// https://www.dropbox.com/s/t4flvtc5gx3qzo8/Screenshot%202016-08-19%2011.29.16.png?dl=0
// https://www.dropbox.com/s/pkn6jsyej70r18x/Screenshot%202016-08-19%2011.29.30.png?dl=0
// look at http://effektif.github.io/react-mentions
// https://nhabuiduc.github.io/
// https://github.com/documentcloud/visualsearch
// http://summitroute.github.io/react-structured-filter
// look at draftjs from facebook (https://github.com/nikgraf/awesome-draft-js)
// https://www.draft-js-plugins.com/plugin/mention looks nice

class Filter extends Component {

  static propTypes = {
    filters: PropTypes.array,
    categories: PropTypes.array,
    operators: PropTypes.array,
    conditions: PropTypes.array,
    options: PropTypes.array,
    removeFilter: PropTypes.func,
    loading: PropTypes.bool,
    fetchOptions: PropTypes.func,
    threshold: PropTypes.number,
    onFiltersChange: PropTypes.func,
    placeholder: PropTypes.string,
    autocomplete: PropTypes.bool
  }

  constructor(props) {
    super(props);

    this.state = {
      query: this.mapFiltersToQuery(this.props.filters),
      autocompleteQuery: '',
      filters: this.props.filters,
      expressions: [],
      selectedIndex: 0,
      showAutocomplete: false,
      focused: false,
      autocompleteLoading: false,
      mode: 'category',
      cursorPosition: { startPos: 0, endPos: 0 }
    };
  }

  componentWillReceiveProps(nextProps) {
    const completeFilters = utils.getCompleteFilters(this.state.filters);
    const nextFilters = nextProps.filters;

    if (!utils.filtersAreEqual(completeFilters, nextFilters) && !this.state.focused) {
      this.setState({
        query: `${this.mapFiltersToQuery(nextProps.filters)} `,
        filters: nextProps.filters
      });
    }
  }

  renderFilterInput = () => {
    return (
      <input
        placeholder={this.props.placeholder || 'Start Typing...'}
        value={this.state.query}
        onChange={this.handleChange}
        onKeyUp={this.handleKeyUp}
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onClick={this.handleClick}
        id="autocomplete-input"
        ref={(c) => { this.AutocompleteInput = c; }}
      />
    );
  }

  mapFiltersToQuery(filters) {
    return filters
           .map(f => `${f.category}${f.operator}${f.option}`)
           .join(' ');
  }

  highlightMatch(el, query) {
    const escapedRegex = query.trim().replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
    const r = RegExp(escapedRegex, 'gi');

    return {
      __html: el.replace(r, '<mark>$&</mark>')
    };
  }

  renderAutocompleteOptions = () => {
    if (!this.props.options.length && this.state.mode === 'option') {
      return <div>No Options</div>;
    }

    return this.filterOptions().map(o => {
      return (
        <div className="autocomplete-option">
          <div className="autocomplete-label">
            <span
              dangerouslySetInnerHTML={this.highlightMatch(
                o.label, this.state.autocompleteQuery
              )}
            />
          </div>
          <div className="autocomplete-type">{o.type}</div>
        </div>
      );
    });
  }

  renderAutocompleteCategories = () => {
    if (!this.props.categories.length && this.state.mode === 'category') {
      return <div>No Categories</div>;
    }

    return this.filterCategories().map(c => {
      return (
        <div className="autocomplete-category">
          <div className="autocomplete-label">
            <span
              dangerouslySetInnerHTML={this.highlightMatch(
                c.label, this.state.autocompleteQuery
              )}
            />
          </div>
          <div className="autocomplete-path">{`${c.path} (${c.type})`}</div>
        </div>
      );
    });
  }

  renderAutocomplete = () => {
    if (!this.state.showAutocomplete || !this.props.autocomplete) {
      return null;
    }

    let autocomplete = this.state.mode === 'category'
                       ? this.renderAutocompleteCategories()
                       : this.renderAutocompleteOptions();

    return (
      <div
        className="autocomplete-list"
        style={{ left: this.state.cursorPosition.endPos * CHAR_WIDTH }}
      >
        <ReactCSSTransitionGroup
          transitionName="Autocomplete"
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          {autocomplete.length > 0 && !this.props.loading && this.state.showAutocomplete &&
            <List
              items={autocomplete}
              selected={[this.state.selectedIndex]}
              multiple={false}
              onChange={this.handleAutocompleteSelect}
              style={{ left: 20 }}
            />
          }
        </ReactCSSTransitionGroup>

        <ReactCSSTransitionGroup
          transitionName="Autocomplete"
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          {this.props.loading && this.state.showAutocomplete &&
            <div className="spinner__container">
              <div className="spinner--autocomplete" />
            </div>
          }
        </ReactCSSTransitionGroup>
      </div>
    );
  }

  getFilters = (query = this.state.query) => {
    return utils.parseFiltersFromQuery(query);
  }

  getAutocompleteMode = () => {
    const { cursorPosition, query } = this.state;
    const filters = this.getFilters();

    if (!query.length || !filters.length) {
      return 'category';
    }

    const position = cursorPosition.endPos;
    const max = Math.max(...filters.map(m => m.filterEndPos));

    if (position > max) {
      if (query[query.length - 1] === ' ') {
        return 'category';
      }

      return filters.pop().expression.indexOf(':') !== -1 ? 'option' : 'category';
    }

    const filter = this.getActiveFilter();

    if (filter.category.length + filter.filterStartPos >= position) {
      // We're in this filter's category range
      return 'category';
    } else if (filter.filterEndPos >= position) {
      // We're in this filter's option range
      return 'option';
    }
    // get cursor position
    // move through filter ranges
    // find where r > caret < r2
    // if in category => category
    // if in option => option
    return 'category';
  }

  getActiveFilter = () => {
    const { cursorPosition } = this.state;
    const position = cursorPosition.endPos;
    const filters = this.getFilters();

    const activeFilter = filters.filter(f => {
      return position <= f.filterEndPos && position >= f.filterStartPos;
    })[0];

    if (!activeFilter) {
      // return filters.pop();
    }

    return activeFilter;
  }

  getAutocompleteQuery = () => {
    const filter = this.getActiveFilter();
    const { mode } = this.state;

    if (!filter) {
      return '';
    }

    if (mode === 'category' && filter) {
      return filter.category;
    } else if (mode === 'option' && filter) {
      return filter.option;
    }

    return '';
  }

  getCursorPosition = () => {
    const cursorPosition = this.getCursorPositionFromInput(
      this.AutocompleteInput
    );

    return new Promise((resolve) => {
      this.setState({ cursorPosition }, () => { resolve(cursorPosition); });
    });
  }

  getCursorPositionFromInput(node) {
    const startPos = node.selectionStart;
    const endPos = node.selectionEnd;

    return { startPos, endPos };
  }

  setCursorPosition() {
    // move cursor to location
  }

  setAutocompleteModeAndQuery = () => {
    // Hacks, need to find a better way
    // to know the cursor position without
    // waiting for changes to be flushed to the DOM
    this.getCursorPosition().then(() => {
      this.setState({
        mode: this.getAutocompleteMode()
      }, () => {
        this.setState({
          autocompleteQuery: this.getAutocompleteQuery(),
          selectedIndex: 0
        }, () => {
          const { mode, autocompleteQuery } = this.state;
          const { threshold } = this.props;

          if (utils.shouldFetchOptions(mode, autocompleteQuery, threshold)) {
            this.props.fetchOptions(autocompleteQuery);
          }
        });
      });
    });
  }

  updateFilters = () => {
    const completeFilters = utils.getCompleteFilters(this.state.filters);

    if (!utils.filtersAreEqual(completeFilters, this.props.filters)) {
      this.props.onFiltersChange(completeFilters);
    }
  }

  handleChange = (e) => {
    // utils.deduplicateQuery(e.target.value)
    const prevFilters = this.state.filters;
    const newFilters = utils.parseFiltersFromQuery(e.target.value);

    this.setState({
      query: e.target.value,
      filters: newFilters,
      showAutocomplete: true
    }, () => {
      this.setAutocompleteModeAndQuery();

      if (prevFilters.length !== newFilters.length) {
        this.updateFilters();
      }
    });
  }

  handleFocus = (e) => {
    this.handleClick(e);
  }

  handleBlur = () => {
    this.setState({
      focused: false
    });

    setTimeout(() => {
      this.setState({
        showAutocomplete: false
      });
    }, 200);
  }

  handleClick = () => {
    this.setState({
      showAutocomplete: true,
      focused: true
    });

    this.setAutocompleteModeAndQuery();
  }

  ensureIndexExists = () => {
    const { selectedIndex } = this.state;
    if ((this.state.mode === 'category' && !this.props.categories[selectedIndex]) ||
          (this.state.mode === 'option' && !this.props.options[selectedIndex])) {
      this.setState({
        selectedIndex: 0
      });
    }
  }

  handleKeyUp = (e) => {
    const key = e.keyCode;

    this.getCursorPosition();

    if (key === KEY.UP && this.state.showAutocomplete) {
      this.setState({
        selectedIndex: this.state.selectedIndex === 0
                       ? this.state.mode === 'category'
                         ? this.props.categories.length -1
                         : this.props.options.length - 1
                       : this.state.selectedIndex - 1
      }, this.ensureIndexExists);
    }

    if (key === KEY.DOWN && this.state.showAutocomplete) {
      e.preventDefault();

      this.setState({
        selectedIndex: this.state.selectedIndex === (this.state.mode === 'category'
                                                  ? this.props.categories.length - 1
                                                  : this.props.options.length - 1)
                                                ? 0
                                                : this.state.selectedIndex + 1
      }, this.ensureIndexExists);
    }

    if (key === KEY.ENTER && this.state.showAutocomplete) {
      this.handleAutocompleteSelect(this.state.selectedIndex);
    }

    if (key === KEY.SPACE) {
      this.updateFilters();
    }

    if (key === KEY.ESC && this.state.showAutocomplete) {
      this.setState({
        showAutocomplete: false
      });
    }

    if (key === KEY.RIGHT || key === KEY.LEFT) {
      this.setAutocompleteModeAndQuery();
    }
  }

  handleKeyDown = (e) => {
    const key = e.keyCode;

    if (key === KEY.UP || key === KEY.DOWN) {
      e.preventDefault();
    }
  }

  // TODO: This doesn't get called if the default option is selected
  // it's an issue with react-list-select, we should roll our own
  handleAutocompleteSelect = (index) => {
    const { mode, cursorPosition, query } = this.state;
    const filters = utils.parseFiltersFromQuery(query);

    const items = mode === 'category' ? this.filterCategories() : this.filterOptions();

    const item = mode === 'category' ? items[index].path : items[index].label;
    const position = cursorPosition.endPos;

    const insertString = mode === 'category'
                         ? `${item}:`
                         : item.indexOf(' ') === -1
                           ? `${item} `
                           : `\"${item}\" `;

    // Find the active filter
    const filter = this.getActiveFilter();

    const queryWithSelection = utils.insertSelection(
      filter, filters, insertString, mode, query, position
    );

    // queryWithSelection = utils.deduplicateQuery(queryWithSelection);

    this.setState({
      selectedIndex: index,
      query: queryWithSelection,
      filters: utils.parseFiltersFromQuery(queryWithSelection)
    }, () => {
      this.setAutocompleteModeAndQuery();
      this.AutocompleteInput.focus();
      this.updateFilters();
    });
  }

  handleClearAll = () => {
    this.setState({
      query: '',
      filters: []
    });
  }

  filterOptions = () => {
    return this.props.options.filter(o => {
      return o.label.toLowerCase().match(
        this.state.autocompleteQuery.toLowerCase()
      );
    });
  }

  filterCategories = () => {
    return this.props.categories.filter(c => {
      return c.path.toLowerCase().match(
        this.state.autocompleteQuery.toLowerCase()
      );
    });
  }

  render() {
    const filterInput = this.renderFilterInput();
    const autocomplete = this.renderAutocomplete();

    return (
      <div className="Filter">
        {filterInput}
        {autocomplete}
      </div>
    );
  }
}

Filter.defaultProps = { baseClassName: 'Filter' };
Filter.displayName = 'Filter';

export default Filter;
