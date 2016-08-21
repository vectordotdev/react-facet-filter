import _ from 'lodash';

export default class Utils {

  static shouldFetchOptions(mode, query, threshold) {
    return mode === 'option' && query.length >= threshold;
  }

  static getExpressionsFromQuery(query) {
    return query.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);
  }

  static parseFiltersFromQuery(query) {
    // break expressions like `user:ben location:"New York"`
    // into ['user:ben', 'location: "New York"']
    const expressions = this.getExpressionsFromQuery(query);

    if (expressions === null || !expressions.length) {
      return [];
    }

    // TODO dedeup expressions so there aren't duplicate
    // filters which would mess things up

    return expressions.map(e => {
      const tokens = e.split(':');

      // this could be wrong if two categories/options are the same
      // find a better way to track the position
      return {
        expression: e,
        category: tokens[0],
        option: tokens[1] !== undefined ? tokens[1] : '',
        filterStartPos: query.indexOf(e),
        filterEndPos: query.indexOf(e) + e.length,
        complete: tokens[0] !== undefined
                  && tokens[1] !== undefined
                  && tokens[0].trim().length > 0
                  && tokens[1].trim().length > 0
      };
    });
  }

  static insertSelection(filter, filters, insertString, mode, query, position) {
    if (!query.length
        || (filter && !filters.filter(f => f.complete).length
        && filter.expression.indexOf(':') === -1)) {
      return insertString;
    } else if (position >= query.length && filters.filter(f => f.complete).length && !filter) {
      return [
        query.slice(0, position),
        insertString,
        query.slice(position)
      ].join('');
    } else if (mode === 'category') {
      // Replace the category
      const startPos = filter ? filter.filterStartPos : query.length;
      const categoryLength = filter ? filter.category.length : 0;
      return [
        query.slice(0, startPos),
        insertString,
        query.slice(startPos + categoryLength + 1, query.length)
      ].join('');
    } else if (mode === 'option') {
      // Replace the option
      return [
        query.slice(0, filter.filterStartPos + filter.category.length + 1),
        insertString,
        query.slice(filter.filterEndPos, query.trim().length)
      ].join('');
    }

    return insertString;
  }

  static deduplicateQuery(query) {
    return _.uniq(this.getExpressionsFromQuery(query)).join(' ');
  }

}
