/**
 * @fileoverview 스마트 랜더링을 지원하는 Renderer 모ㄷ델
 * @author NHN Ent. FE Development Team
 */
'use strict';

var _ = require('underscore');

var Renderer = require('./renderer');
var dimensionConst = require('../common/constMap').dimension;

var CELL_BORDER_WIDTH = dimensionConst.CELL_BORDER_WIDTH;

// The ratio of buffer size to bodyHeight
var BUFFER_RATIO = 0.3;

// The ratio of buffer hit size to bodyHeight
var BUFFER_HIT_RATIO = 0.1;

/**
 *  View 에서 Rendering 시 사용할 객체
 *  Smart Rendering 을 지원한다.
 *  @module model/renderer-smart
 * @extends module:model/renderer
 */
var SmartRenderer = Renderer.extend(/**@lends module:model/renderer-smart.prototype */{
    /**
     * @constructs
     */
    initialize: function() {
        Renderer.prototype.initialize.apply(this, arguments);
        this.on('change:scrollTop', this._onChangeScrollTop, this);
        this.listenTo(this.dimensionModel, 'change:bodyHeight', this.refresh);
    },

    /**
     * Event handler for change:scrollTop event
     * @private
     */
    _onChangeScrollTop: function() {
        if (this._shouldRefresh(this.get('scrollTop'))) {
            this.refresh();
        }
    },

    /**
     * Calculate the range to render and set the attributes.
     * @param {number} scrollTop - scrollTop
     * @private
     */
    _setRenderingRange: function(scrollTop) {
        var dimensionModel = this.dimensionModel;
        var dataModel = this.dataModel;
        var coordRowModel = this.coordRowModel;
        var bodyHeight = dimensionModel.get('bodyHeight');
        var bufferSize = parseInt(bodyHeight * BUFFER_RATIO, 10);
        var startIndex = Math.max(coordRowModel.indexOf(scrollTop - bufferSize), 0);
        var endIndex = Math.min(coordRowModel.indexOf(scrollTop + bodyHeight + bufferSize), dataModel.length - 1);
        var top = coordRowModel.getOffsetAt(startIndex);
        var bottom = coordRowModel.getOffsetAt(endIndex) +
            coordRowModel.getHeightAt(endIndex) + CELL_BORDER_WIDTH;

        if (dataModel.isRowSpanEnable()) {
            startIndex += this._getStartRowSpanMinCount(startIndex);
            endIndex += this._getEndRowSpanMaxCount(endIndex);
        }

        this.set({
            top: top,
            bottom: bottom,
            startIndex: startIndex,
            endIndex: endIndex
        });
    },

    /**
     * 렌더링을 시작하는 행에 rowSpan 정보가 있으면, count 값이 가장 작은 행의 값을 반환한다.
     * @param {number} startIndex 시작하는 행의 Index
     * @returns {number} rowSpan의 count 값 (0 이하)
     * @private
     */
    _getStartRowSpanMinCount: function(startIndex) {
        var firstRow = this.dataModel.at(startIndex),
            result = 0,
            counts;

        if (firstRow) {
            counts = _.pluck(firstRow.getRowSpanData(), 'count');
            counts.push(0); // count가 음수인 경우(mainRow가 아닌 경우)에만 최소값을 구함. 없으면 0
            result = _.min(counts);
        }
        return result;
    },

    /**
     * 렌더링할 마지막 행에 rowSpan 정보가 있으면, count 값이 가장 큰 행의 값을 반환한다.
     * @param {number} endIndex 마지막 행의 Index
     * @returns {number} rowSpan의 count 값 (0 이상)
     * @private
     */
    _getEndRowSpanMaxCount: function(endIndex) {
        var lastRow = this.dataModel.at(endIndex),
            result = 0,
            counts;

        if (lastRow) {
            counts = _.pluck(lastRow.getRowSpanData(), 'count');
            counts.push(0); // count가 양수인 경우(mainRow인 경우)에만 최대값을 구함. 없으면 0
            result = _.max(counts);
        }
        return result;
    },

    /**
     * scrollTop 값 에 따라 rendering 해야하는지 판단한다.
     * @param {Number} scrollTop 랜더링 범위를 결정하기 위한 현재 scrollTop 위치 값
     * @returns {boolean}    랜더링 해야할지 여부
     * @private
     */
    _shouldRefresh: function(scrollTop) {
        var bodyHeight = this.dimensionModel.get('bodyHeight');
        var scrollBottom = scrollTop + bodyHeight;
        var totalRowHeight = this.dimensionModel.get('totalRowHeight');
        var top = this.get('top');
        var bottom = this.get('bottom');
        var bufferHitSize = parseInt(bodyHeight * BUFFER_HIT_RATIO, 10);
        var hitTopBuffer = scrollTop - top < bufferHitSize;
        var hitBottomBuffer = bottom - scrollBottom < bufferHitSize;

        return (hitTopBuffer && top > 0) || (hitBottomBuffer && bottom < totalRowHeight);
    }
});

// exports consts for external use
SmartRenderer.BUFFER_RATIO = BUFFER_RATIO;
SmartRenderer.BUFFER_HIT_RATIO = BUFFER_HIT_RATIO;

module.exports = SmartRenderer;
