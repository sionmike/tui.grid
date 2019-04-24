import { Column, Range, Viewport, Dimension, Data, RowCoords } from './types';
import { reactive, Reactive } from '../helper/reactive';
import { arrayEqual } from '../helper/common';

function indexOfRow(rowOffsets: number[], posY: number) {
  const rowOffset = rowOffsets.findIndex((offset) => offset > posY);

  return rowOffset === -1 ? rowOffsets.length - 1 : rowOffset - 1;
}

interface ViewPortOption {
  data: Data;
  column: Column;
  dimension: Dimension;
  rowCoords: RowCoords;
}

export function create({ data, column, dimension, rowCoords }: ViewPortOption): Reactive<Viewport> {
  const { visibleColumns } = column;

  return reactive({
    scrollLeft: 0,
    scrollTop: 0,
    get colRange(this: Viewport) {
      return [0, visibleColumns.L.length + visibleColumns.R.length] as Range;
    },
    get rowRange(this: Reactive<Viewport>) {
      const { bodyHeight } = dimension;
      const { offsets } = rowCoords;

      // safari uses negative scrollTop for bouncing effect
      const scrollY = Math.max(this.scrollTop, 0);

      const start = indexOfRow(offsets, scrollY);
      const end = indexOfRow(offsets, scrollY + bodyHeight) + 1;
      const value = [start, end] as Range;

      const prevValue = this.__storage__.rowRange;
      if (prevValue && arrayEqual(prevValue, value)) {
        return prevValue;
      }

      return value;
    },
    get rows(this: Viewport) {
      return data.viewData.slice(...this.rowRange);
    },
    get offsetY(this: Viewport) {
      return rowCoords.offsets[this.rowRange[0]];
    }
  });
}