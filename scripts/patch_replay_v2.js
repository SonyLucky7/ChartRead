const fs = require('fs');
const path = require('path');

// ============================================================================
// ChartRead Bar Replay Engine v2 (Perfected + Full Multi-Timeframe Support)
// ============================================================================

const replayEngineV2 = `
        // ================================================================
        // Module 488104 (Session - Suppress backend replay session disconnects)
        // ================================================================
        try {
          const mod488104 = req(488104);
          if (mod488104 && mod488104.Session) {
            const sessionProto = mod488104.Session.prototype;
            if (!sessionProto.__cr_crit_patched) {
              sessionProto.__cr_crit_patched = true;
              const origOnCrit = sessionProto._onCriticalError;
              sessionProto._onCriticalError = function(reason, info) {
                // Suppress critical errors during replay or for replay sessions
                if (window.__cr_replay_active) return;
                if (this.constructor.name === 'H' || (this.sessionId && String(this.sessionId()).startsWith('rs_'))) {
                  return;
                }
                try { return origOnCrit.apply(this, arguments); } catch(e) {}
              };
            }
          }
        } catch(e) {}

        // ================================================================
        // Module 909517 (Series - Retain local historical candles & Multi-Timeframe Replay)
        // ================================================================
        try {
          const mod909517 = req(909517);
          if (mod909517 && mod909517.Series) {
            const seriesProto = mod909517.Series.prototype;
            if (!seriesProto.__cr_replay_patched) {
              seriesProto.__cr_replay_patched = true;

              // Always permit resolution and symbol changes during replay
              seriesProto.canChangeResolution = function(e) {
                return Promise.resolve(true);
              };
              seriesProto.canChangeSymbol = function(e) {
                return Promise.resolve({ result: true });
              };
              seriesProto._isReplayResolutionAvailableForUser = function() {
                return true;
              };

              // Ensure resolving symbol does not throw during timeframe changes in replay
              seriesProto._getResolvingSymbolObject = function() {
                return this._getSymbolObject({ overriddenSymbol: this._symbolForResolve(), skipDefaultSession: true });
              };
              seriesProto._processReplayOnApplySymbolParamsChanges = function(e, t) {
                return Promise.resolve();
              };
              seriesProto._modifyReplaySeries = function() {
                return Promise.resolve();
              };

              // Stub switchToReplay: set subscriber and permit all resolutions
              seriesProto.switchToReplay = function(subscriber, isReplayResolutionAvailableForUser, timestamp) {
                try {
                  const safeSub = subscriber || {
                    id: 'cr_local_replay',
                    generateReplaySymbol: (s) => s,
                    modifySeries: () => {},
                    onSeriesModified: () => ({ unsubscribeAll: () => {} }),
                    destroy: () => {}
                  };
                  this._replaySubscriber.setValue(safeSub);
                  this._isReplayResolutionAvailableForUser = () => true;
                  this._onInReplayStateChanged.fire();
                } catch(e) {}
              };

              // Hook switchToRealtime: exit our local replay first
              const origSwitchToRealtime = seriesProto.switchToRealtime;
              seriesProto.switchToRealtime = function() {
                if (window.__cr_replay_active && typeof window.__cr_exit_replay === 'function') {
                  window.__cr_exit_replay();
                }
                try { return origSwitchToRealtime.apply(this, arguments); } catch(e) {}
              };

              // Hook clearData: DO NOT exit replay; clear bars cutoff cache so new resolution loads
              const origClearData = seriesProto.clearData;
              seriesProto.clearData = function() {
                try {
                  const b = this.bars();
                  if (b) delete b.__cr_cutoff_end;
                } catch(e) {}
                return origClearData.apply(this, arguments);
              };

              // Hook setSymbol: exit replay when symbol changes
              const origSetSymbol = seriesProto.setSymbol;
              seriesProto.setSymbol = function() {
                if (window.__cr_replay_active && typeof window.__cr_exit_replay === 'function') {
                  window.__cr_exit_replay();
                }
                return origSetSymbol.apply(this, arguments);
              };
            }
          }
        } catch(e) {}

        // ================================================================
        // Module 318057 (Bar Replay UI Controller & Complete Local Playback Engine v2)
        // ================================================================
        try {
          if (req.e && !window.__cr_replay_engine_v2_installed) {
            window.__cr_replay_engine_v2_installed = true;

            const replayChunks = [
              61404, 96212, 72260, 59830, 10338, 25220, 88550, 64634, 44106, 52869, 10589, 89185, 25931, 91878, 72542, 51360, 62070, 24827, 24270, 49050, 45089, 94533, 11828, 60945, 37517, 86605, 20953, 31466, 38782, 30079, 15632, 95392, 31368, 30148, 73856, 50442, 37704, 17637, 19129, 52392, 65088, 98224, 33985, 9271, 94958, 41627, 14041, 96081, 94686, 31713, 4520, 54630
            ];

            Promise.all(replayChunks.map(id => req.e(id))).then(() => {
              const mod318057 = req(318057);

              // ---- Resolve ReplayStatus enum ----
              let ReplayStatus = { Pause: 1, AutoPlay: 2, Finish: 3, Undefined: 0 };
              try {
                const mod668294 = req(668294);
                if (mod668294 && mod668294.ReplayStatus) ReplayStatus = mod668294.ReplayStatus;
              } catch(e) {}

              // ---- getChartModel helper ----
              const getChartModel = function(w) {
                try {
                  const api = window.TradingViewApi;
                  const target = w || api?._activeChartWidgetWV?.value?.();
                  if (!target) return null;
                  if (target.chartModel) return target.chartModel();
                  if (target.model) {
                    const m = target.model();
                    return m?.model ? m.model() : m;
                  }
                  return null;
                } catch(e) { return null; }
              };

              // ---- Clamp Bars Helper (Universal Multi-Timeframe Anchor) ----
              const clampBarsToCutoff = function(barsObj) {
                if (!window.__cr_replay_active || typeof window.__cr_cutoff_timestamp !== 'number') return;
                const items = barsObj._items;
                if (!items || items.length === 0) return;

                let matchedIdx = items.length - 1;
                for (let j = 0; j < items.length; j++) {
                  if (items[j]?.value?.[0] > window.__cr_cutoff_timestamp) {
                    matchedIdx = Math.max(0, j - 1);
                    break;
                  }
                }
                barsObj.__cr_cutoff_end = matchedIdx + 1;
                barsObj._end = matchedIdx + 1;
                window.__cr_cutoff_index = matchedIdx;
                try { barsObj._invalidateSearchCaches(); } catch(e) {}
              };

              // ---- Install Bars.prototype guards ----
              const installBarsGuards = function(b) {
                const BarsProto = Object.getPrototypeOf(b);
                if (BarsProto.__cr_guarded_v2) return;
                BarsProto.__cr_guarded_v2 = true;

                ['_append', '_merge', 'add', 'merge'].forEach(name => {
                  const orig = BarsProto[name];
                  if (!orig) return;
                  BarsProto[name] = function() {
                    const res = orig.apply(this, arguments);
                    if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === 'number') {
                      clampBarsToCutoff(this);
                    }
                    return res;
                  };
                });
                if (typeof BarsProto.set === 'function') {
                  const origSet = BarsProto.set;
                  BarsProto.set = function() {
                    const res = origSet.apply(this, arguments);
                    if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === 'number') {
                      clampBarsToCutoff(this);
                    }
                    return res;
                  };
                }
              };

              // ---- Hook ChartModel lightUpdate to guarantee multi-timeframe clamp ----
              const installModelGuards = function(m) {
                if (!m) return;
                const ModelProto = Object.getPrototypeOf(m);
                if (ModelProto.__cr_model_guarded) return;
                ModelProto.__cr_model_guarded = true;

                const origLight = ModelProto.lightUpdate;
                ModelProto.lightUpdate = function() {
                  try {
                    if (window.__cr_replay_active && typeof window.__cr_cutoff_timestamp === 'number') {
                      const ms = this.mainSeries();
                      if (ms) clampBarsToCutoff(ms.bars());
                    }
                  } catch(e) {}
                  return origLight.apply(this, arguments);
                };
              };

              // ---- Sync Chart to Replay Point ----
              window.__cr_sync_chart_to_point = function(targetIndex) {
                const m = getChartModel();
                if (!m) return null;

                installModelGuards(m);

                const s = m.mainSeries();
                const b = s.bars();
                const ts = m.timeScale();

                installBarsGuards(b);

                const maxIdx = b._items.length - 1;
                const clampedIdx = Math.max(0, Math.min(maxIdx, targetIndex));

                if (!window.__cr_replay_active) {
                  window.__cr_replay_full_end = b._items.length;
                }

                window.__cr_cutoff_index = clampedIdx;
                window.__cr_replay_active = true;

                // Mark series in replay mode with resilient mock subscriber
                try {
                  if (s && s._replaySubscriber) {
                    s._replaySubscriber.setValue({
                      id: 'cr_local_replay',
                      generateReplaySymbol: (sym) => sym,
                      modifySeries: () => {},
                      onSeriesModified: () => ({ unsubscribeAll: () => {} }),
                      destroy: () => {}
                    });
                  }
                } catch(e) {}

                const targetBar = b._items[clampedIdx];
                const targetTime = targetBar ? targetBar.value[0] : null;
                const targetBarIndex = targetBar ? targetBar.index : clampedIdx;

                if (targetTime) {
                  window.__cr_cutoff_timestamp = targetTime;
                }

                // Truncate main series bars
                b.__cr_cutoff_end = clampedIdx + 1;
                b._end = clampedIdx + 1;
                try { b._invalidateSearchCaches(); } catch(e) {}

                // Set timeScale base index & scroll
                try {
                  if (ts && typeof ts.setBaseIndex === 'function') {
                    ts.setBaseIndex(targetBarIndex);
                    ts.scrollToRealtime();
                  }
                } catch(e) {}

                // Sync ALL studies (Volume, RSI, MACD, MAs, etc.)
                try {
                  const studies = m.allStudies ? m.allStudies() : [];
                  for (const study of studies) {
                    const sd = study.data ? study.data() : null;
                    if (!sd || !sd._items || sd._items.length === 0) continue;

                    const sdProto = Object.getPrototypeOf(sd);
                    if (!sdProto.__cr_guarded_v2) {
                      sdProto.__cr_guarded_v2 = true;
                      ['_append', '_merge', 'add', 'set'].forEach(name => {
                        const orig = sdProto[name];
                        if (!orig || typeof orig !== 'function') return;
                        sdProto[name] = function() {
                          const res = orig.apply(this, arguments);
                          if (window.__cr_replay_active && typeof this.__cr_cutoff_end === 'number') {
                            const maxLen = this._items ? this._items.length : this._end;
                            this._end = Math.min(maxLen, this.__cr_cutoff_end);
                            try { this._invalidateSearchCaches(); } catch(e) {}
                          }
                          return res;
                        };
                      });
                    }

                    let sEnd = sd._items.length;
                    if (targetTime) {
                      for (let j = 0; j < sd._items.length; j++) {
                        const row = sd._items[j];
                        if (row && row.value && row.value[0] > targetTime) {
                          sEnd = j;
                          break;
                        }
                      }
                    }

                    sd.__cr_cutoff_end = sEnd;
                    sd._end = sEnd;
                    try { if (sd._invalidateSearchCaches) sd._invalidateSearchCaches(); } catch(e) {}
                    try { m.updateSource(study); } catch(e) {}
                  }
                } catch(e) {}

                // Update & render
                try {
                  m.updateSource(s);
                  m.lightUpdate();
                } catch(e) {}

                return { clampedIdx, targetTime, targetBarIndex, end: b._end };
              };

              // ---- Exit Replay (with re-entrancy guard) ----
              window.__cr_exit_replay = function() {
                if (window.__cr_exiting_replay) return;
                if (!window.__cr_replay_active) return;

                window.__cr_exiting_replay = true;
                window.__cr_replay_active = false;
                window.__cr_cutoff_index = null;
                window.__cr_cutoff_timestamp = null;

                // Stop any autoplay timer
                try {
                  const api = window.TradingViewApi;
                  const ctrl = api?._replayApi?._replayUIController;
                  const mgr = ctrl?._replayManager;
                  if (mgr) {
                    if (mgr.__cr_timer) {
                      clearInterval(mgr.__cr_timer);
                      mgr.__cr_timer = null;
                    }
                    try { mgr._isAutoplayEnabled.setValue(false); } catch(e) {}
                    try { mgr._isReplayStarted.setValue(false); } catch(e) {}
                    try { mgr._replayPoint.setValue(null); } catch(e) {}
                    try { mgr._replaySelectedPoint.setValue(null); } catch(e) {}
                  }
                } catch(e) {}

                const m = getChartModel();
                if (!m) {
                  window.__cr_exiting_replay = false;
                  return;
                }

                const s = m.mainSeries();
                const b = s.bars();

                // Restore main bars
                delete b.__cr_cutoff_end;
                b._end = b._items.length;
                try { b._invalidateSearchCaches(); } catch(e) {}

                // Clear series replay subscriber
                try {
                  if (s && s._replaySubscriber) {
                    s._replaySubscriber.setValue(null);
                  }
                } catch(e) {}

                // Restore ALL studies
                try {
                  const studies = m.allStudies ? m.allStudies() : [];
                  for (const st of studies) {
                    const sd = st.data ? st.data() : null;
                    if (sd && sd._items) {
                      delete sd.__cr_cutoff_end;
                      sd._end = sd._items.length;
                      try { if (sd._invalidateSearchCaches) sd._invalidateSearchCaches(); } catch(e) {}
                      try { m.updateSource(st); } catch(e) {}
                    }
                  }
                } catch(e) {}

                // Reset TimeScale
                try {
                  const ts = m.timeScale();
                  if (ts) {
                    ts.resetBaseIndex();
                    try { ts.resetRightOffset(); } catch(e) {}
                    ts.scrollToRealtime();
                  }
                } catch(e) {}

                // Full model redraw
                try {
                  m.updateSource(s);
                  m.fullUpdate();
                } catch(e) {}

                window.__cr_replay_full_end = null;
                window.__cr_exiting_replay = false;
              };

              // ---- hookManager ----
              function hookManager(mgr, widget) {
                if (!mgr || mgr.__cr_v2_hooked) return;
                mgr.__cr_v2_hooked = true;

                mgr.canChangeSymbolParams = () => Promise.resolve({ res: true });
                mgr._handleAddRemoveSeriesError = () => {};
                mgr._handleError = () => {};
                mgr._handleResetError = () => {};

                // Safe stopReplay override: no assertion error
                mgr.stopReplay = function() {
                  if (this.__cr_timer) {
                    clearInterval(this.__cr_timer);
                    this.__cr_timer = null;
                  }
                  try { this._isAutoplayEnabled.setValue(false); } catch(e) {}
                  try { this._isReplayStarted.setValue(false); } catch(e) {}
                  try { this._replayPoint.setValue(null); } catch(e) {}
                  try { this._replaySelectedPoint.setValue(null); } catch(e) {}
                  const models = this._models || [];
                  this.setReplayStatus(models, ReplayStatus.Undefined);
                  return true;
                };

                // resetReplay: when user selects a new bar
                mgr.resetReplay = function(targetTimestamp, t = true) {
                  try { if (this._isAutoplayEnabled.value()) this.stopAutoplay(); } catch(e) {}

                  window.__cr_cutoff_timestamp = targetTimestamp;

                  const m = getChartModel(widget);
                  const ms = m ? m.mainSeries() : null;
                  if (ms) {
                    const b = ms.bars();
                    let matchedIdx = b._items.length - 1;
                    for (let i = 0; i < b._items.length; i++) {
                      if (b._items[i]?.value?.[0] >= targetTimestamp) {
                        matchedIdx = i;
                        break;
                      }
                    }
                    window.__cr_sync_chart_to_point(matchedIdx);
                  }

                  try {
                    if (this._replaySelectedPoint && typeof this._replaySelectedPoint.setValue === 'function')
                      this._replaySelectedPoint.setValue(targetTimestamp);
                    if (this._replayPoint && typeof this._replayPoint.setValue === 'function')
                      this._replayPoint.setValue(targetTimestamp);
                    if (this._isReplayStarted && typeof this._isReplayStarted.setValue === 'function')
                      this._isReplayStarted.setValue(true);
                  } catch(e) {}

                  try {
                    const models = this._models ? this._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                    this.setReplayStatus(models, ReplayStatus.Pause);
                  } catch(e) {}
                };

                // doReplayStep: advance by N bars
                mgr.doReplayStep = function(step = 1) {
                  const m = getChartModel(widget);
                  const ms = m ? m.mainSeries() : null;
                  if (!ms) return Promise.resolve();
                  const b = ms.bars();

                  const curIdx = typeof window.__cr_cutoff_index === 'number' ? window.__cr_cutoff_index : b._items.length - 1;
                  const nextIdx = curIdx + step;

                  if (nextIdx >= b._items.length - 1) {
                    this.stopAutoplay();
                    window.__cr_sync_chart_to_point(b._items.length - 1);
                    return Promise.resolve();
                  }

                  const res = window.__cr_sync_chart_to_point(nextIdx);
                  if (res && res.targetTime) {
                    try {
                      if (this._replayPoint && typeof this._replayPoint.setValue === 'function')
                        this._replayPoint.setValue(res.targetTime);
                    } catch(e) {}
                  }
                  return Promise.resolve();
                };

                // startAutoplay
                mgr.startAutoplay = function() {
                  try { this._isAutoplayEnabled.setValue(true); } catch(e) {}
                  try {
                    const models = this._models ? this._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                    this.setReplayStatus(models, ReplayStatus.AutoPlay);
                  } catch(e) {}

                  if (this.__cr_timer) { clearInterval(this.__cr_timer); this.__cr_timer = null; }

                  const self = this;
                  const getDelay = () => {
                    try {
                      return Math.max(50, this._autoplayDelay ? this._autoplayDelay.value() : 1000);
                    } catch(e) { return 1000; }
                  };

                  const tick = () => {
                    try {
                      if (!self._isAutoplayEnabled.value() || !window.__cr_replay_active) {
                        if (self.__cr_timer) { clearInterval(self.__cr_timer); self.__cr_timer = null; }
                        return;
                      }
                      self.doReplayStep(1);
                    } catch(e) {
                      if (self.__cr_timer) { clearInterval(self.__cr_timer); self.__cr_timer = null; }
                    }
                  };

                  const startTimer = () => {
                    if (self.__cr_timer) clearInterval(self.__cr_timer);
                    self.__cr_timer = setInterval(tick, getDelay());
                  };

                  if (this._autoplayDelay && !this.__cr_delay_sub_v2) {
                    this.__cr_delay_sub_v2 = true;
                    try {
                      this._autoplayDelay.subscribe(() => {
                        try {
                          if (self._isAutoplayEnabled.value() && self.__cr_timer) startTimer();
                        } catch(e) {}
                      });
                    } catch(e) {}
                  }

                  startTimer();
                };

                // stopAutoplay
                mgr.stopAutoplay = function() {
                  if (this.__cr_timer) {
                    clearInterval(this.__cr_timer);
                    this.__cr_timer = null;
                  }
                  try { this._isAutoplayEnabled.setValue(false); } catch(e) {}
                  try {
                    const models = this._models ? this._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                    this.setReplayStatus(models, ReplayStatus.Pause);
                  } catch(e) {}
                };
              }

              // ---- Patch ReplayUIController prototype ----
              if (mod318057 && mod318057.ReplayUIController) {
                const proto = mod318057.ReplayUIController.prototype;

                // All popular resolutions for the replay toolbar dropdown
                const ALL_REPLAY_RESOLUTIONS = [
                  "1S", "5S", "10S", "15S", "30S",
                  "1", "2", "3", "5", "10", "15", "30", "45",
                  "60", "120", "180", "240",
                  "1D", "1W", "1M"
                ];

                const origShowToolbar = proto.showReplayToolbar;
                proto.showReplayToolbar = function() {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e) {}
                  return origShowToolbar.apply(this, arguments);
                };

                proto.enableReplayMode = function(e = true) {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e2) {}
                  this._setReplayModeEnabled(true, e);
                  return Promise.resolve();
                };

                const origSetReplayModeEnabled = proto._setReplayModeEnabled;
                proto._setReplayModeEnabled = function(enabled, t = enabled) {
                  if (!enabled && window.__cr_replay_active) {
                    window.__cr_exit_replay();
                  }
                  try {
                    return origSetReplayModeEnabled.apply(this, arguments);
                  } catch(e) {}
                };

                const origDestroy = proto.destroy;
                proto.destroy = function() {
                  if (window.__cr_replay_active) window.__cr_exit_replay();
                  return origDestroy.apply(this, arguments);
                };

                // Suppress paywalls and point errors
                proto._onPointTooDeepError = function() {};
                proto._onParamsNotApplicableForReplay = function() {};

                // Always populate full resolutions list in Replay Toolbar
                proto._updateAllReplayResolutions = function() {
                  if (this._allReplayResolutions) {
                    this._allReplayResolutions.setValue(ALL_REPLAY_RESOLUTIONS);
                  }
                };

                proto._updateFilteredByCurrentPointReplayResolutions = function() {
                  const cur = this._activeChartWidget?.value()?.resolution?.() || "15";
                  if (this._autoReplayResolution) this._autoReplayResolution.setValue(cur);
                  if (this._replayResolutions) this._replayResolutions.setValue([...ALL_REPLAY_RESOLUTIONS, null]);
                  try { this._correctCurrentReplayResolutionValue(); } catch(e) {}
                };

                // Change resolution from Replay Toolbar dropdown
                proto.changeReplayResolution = function(newRes) {
                  if (!newRes) return;
                  try {
                    if (this._currentReplayResolution) this._currentReplayResolution.setValue(newRes);
                    const w = this._currentChartWidget ? this._currentChartWidget() : (window.TradingViewApi?._activeChartWidgetWV?.value?.());
                    if (w && typeof w.setResolution === 'function') {
                      w.setResolution(newRes);
                    }
                  } catch(e) {}
                };

                proto.pointsIsTooDeepForCharts = function() {
                  if (this._pointsIsTooDeepForCharts) {
                    try { this._pointsIsTooDeepForCharts.setValue([]); } catch(e) {}
                    return this._pointsIsTooDeepForCharts;
                  }
                  if (!this.__cr_pointsTooDeepWV) {
                    this.__cr_pointsTooDeepWV = {
                      value: () => [],
                      setValue: () => {},
                      subscribe: () => ({ unsubscribe: () => {} }),
                      unsubscribe: () => {},
                      weakReference: function() { return this; },
                      ownership: function() { return this; }
                    };
                  }
                  return this.__cr_pointsTooDeepWV;
                };

                // _onPointSelected
                proto._onPointSelected = function(widget, timestamp) {
                  try {
                    hookManager(this._replayManager, widget);
                  } catch(e) {}

                  window.__cr_cutoff_timestamp = timestamp;

                  const w = widget || (this._currentChartWidget ? this._currentChartWidget() : null);
                  const m = getChartModel(w);
                  const ms = m?.mainSeries ? m.mainSeries() : null;

                  if (ms) {
                    const b = ms.bars();
                    let matchedIdx = b._items.length - 1;
                    for (let i = 0; i < b._items.length; i++) {
                      if (b._items[i]?.value?.[0] >= timestamp) {
                        matchedIdx = i;
                        break;
                      }
                    }
                    window.__cr_sync_chart_to_point(matchedIdx);
                  }

                  const mgr = this._replayManager;
                  if (mgr) {
                    try {
                      if (mgr._replayPoint && typeof mgr._replayPoint.setValue === 'function')
                        mgr._replayPoint.setValue(timestamp);
                      if (mgr._replaySelectedPoint && typeof mgr._replaySelectedPoint.setValue === 'function')
                        mgr._replaySelectedPoint.setValue(timestamp);
                      if (mgr._isReplayStarted && typeof mgr._isReplayStarted.setValue === 'function')
                        mgr._isReplayStarted.setValue(true);
                    } catch(e) {}

                    try {
                      const models = mgr._models ? mgr._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                      mgr.setReplayStatus(models, ReplayStatus.Pause);
                    } catch(e) {}
                  }

                  try { this.showReplayToolbar(); } catch(e) {}

                  try {
                    if (w && typeof w.cancelRequestSelectPoint === 'function') {
                      w.cancelRequestSelectPoint();
                    }
                  } catch(e) {}
                };

                // toggleAutoplay
                proto.toggleAutoplay = function() {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e) {}
                  const mgr = this._replayManager;
                  if (!mgr) return;

                  try {
                    if (mgr.isAutoplayStarted().value()) {
                      mgr.stopAutoplay();
                    } else {
                      try {
                        if (this._currentChartWidget) this._currentChartWidget().cancelRequestSelectPoint();
                      } catch(e) {}
                      mgr.startAutoplay();
                    }
                  } catch(e) {}
                };

                // doStep
                proto.doStep = function() {
                  try {
                    hookManager(this._replayManager, this._currentChartWidget ? this._currentChartWidget() : null);
                  } catch(e) {}
                  const mgr = this._replayManager;
                  if (!mgr) return Promise.resolve();

                  try {
                    if (mgr.isAutoplayStarted().value()) mgr.stopAutoplay();
                  } catch(e) {}

                  return mgr.doReplayStep(1);
                };

                // goToRealtime (>>| button)
                proto.goToRealtime = function() {
                  const mgr = this._replayManager;
                  try {
                    if (mgr && mgr.isAutoplayStarted().value()) mgr.stopAutoplay();
                  } catch(e) {}
                  
                  const m = getChartModel(this._currentChartWidget ? this._currentChartWidget() : null);
                  const ms = m?.mainSeries ? m.mainSeries() : null;
                  if (ms) {
                    const b = ms.bars();
                    window.__cr_sync_chart_to_point(b._items.length - 1);
                    try {
                      if (mgr && mgr._replayPoint && typeof mgr._replayPoint.setValue === 'function') {
                        if (b.last()) mgr._replayPoint.setValue(b.last().value[0]);
                      }
                    } catch(e) {}
                  }

                  if (mgr) {
                    try {
                      const models = mgr._models ? mgr._models.filter(m => { try { return m.isInReplay().value(); } catch(e) { return false; } }) : [];
                      mgr.setReplayStatus(models, ReplayStatus.Pause);
                    } catch(e) {}
                  }
                };

                // requestCloseReplay: instant clean exit with NO popups
                proto.requestCloseReplay = function(force = true, callback) {
                  const mgr = this._replayManager;
                  if (mgr) {
                    try { if (mgr.isAutoplayStarted().value()) mgr.stopAutoplay(); } catch(e) {}
                    try { if (mgr._isReplayStarted) mgr._isReplayStarted.setValue(false); } catch(e) {}
                    try { if (mgr._replayPoint) mgr._replayPoint.setValue(null); } catch(e) {}
                    try { if (mgr._replaySelectedPoint) mgr._replaySelectedPoint.setValue(null); } catch(e) {}
                    try {
                      const models = mgr._models || [];
                      mgr.setReplayStatus(models, ReplayStatus.Undefined);
                    } catch(e) {}
                  }

                  // 1. Restore chart data immediately (all bars, volume, studies, time scale)
                  window.__cr_exit_replay();

                  // 2. Hide toolbar and disable replay mode
                  try {
                    this._setReplayModeEnabled(false);
                  } catch(e) {}

                  // 3. Dismiss any confirmation dialogs (e.g. "Leave current replay?")
                  try {
                    const dialogs = document.querySelectorAll('#leaveReplayDialog, [data-dialog-name="confirm-dialog"]');
                    dialogs.forEach(d => {
                      if (/leave current replay/i.test(d.innerText || '')) {
                        const closeBtn = d.querySelector('[class*="closeButton"], [aria-label="Close"]');
                        if (closeBtn) closeBtn.click();
                        else d.remove();
                      }
                    });
                  } catch(e) {}

                  if (typeof callback === 'function') {
                    try { callback(); } catch(e) {}
                  }
                  return Promise.resolve();
                };
              }
            }).catch((err) => { console.warn('[ChartRead Replay] Chunk load error:', err); });
          }
        } catch(e) {}
`;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  const startMarker = '// ================================================================\n        // Module 488104 (Session';
  const endMarker = '// Module 19710 (applyStudyWithCheckPermission';

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find markers in:', filePath);
    return false;
  }

  let actualStart = startIdx;
  const doubleDiv = '// ================================================================\n        // ================================================================\n';
  const possibleDoubleDiv = content.lastIndexOf(doubleDiv, startIdx);
  if (possibleDoubleDiv !== -1 && (startIdx - possibleDoubleDiv) < 120) {
    const divStart = content.lastIndexOf('// ====', possibleDoubleDiv);
    if (divStart !== -1 && (possibleDoubleDiv - divStart) < 20) {
      actualStart = divStart;
    } else {
      actualStart = possibleDoubleDiv;
    }
  }

  const before = content.slice(0, actualStart);
  const after = content.slice(endIdx);

  content = before + replayEngineV2.trim() + '\n\n        ' + after;

  // Also enhance handlePaywallDialogs in content if present
  if (content.includes('const handlePaywallDialogs')) {
    content = content.replace(
      'txt.includes("registration_promotion")',
      'txt.includes("registration_promotion") ||\n            txt.includes("Try AI Copilot") ||\n            txt.includes("Copilot empowers") ||\n            txt.includes("Non-standard intervals") ||\n            txt.includes("Seconds intervals") ||\n            txt.includes("Intraday bar replay") ||\n            txt.includes("Go Pro") ||\n            txt.includes("30-day Free Trial") ||\n            txt.includes("trial period")'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully patched replay engine v2 into:', path.basename(filePath));
  return true;
}

const file1 = path.join(__dirname, '..', 'preload', 'platform-preload.js');
const file2 = path.join(__dirname, '..', 'runtime', 'resources', 'app', 'preload', 'platform-preload.js');

const r1 = patchFile(file1);
const r2 = patchFile(file2);

if (r1 && r2) {
  console.log('\n🎯 Both preload files patched successfully!');
} else {
  console.log('\n⚠️ Check file paths.');
}
