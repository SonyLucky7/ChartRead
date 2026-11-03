import { evalInPage, captureScreenshot } from './cdp_helper.js';

const ARTIFACT_DIR = 'C:/Users/hac/.gemini/antigravity/brain/11adb640-c842-45b0-8444-193fc36777c8';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================');
  console.log('🚀 CHARTREAD BAR REPLAY: FULL MULTI-TIMEFRAME TEST SUITE');
  console.log('================================================================\n');

  // STEP 1: INITIAL STATE
  console.log('--- Step 1: Initial Chart State ---');
  const init = await evalInPage(`(() => {
    const api = window.TradingViewApi;
    const w = api._activeChartWidgetWV.value();
    const s = w.chartModel().mainSeries();
    const b = s.bars();
    return {
      resolution: w.resolution(),
      totalBars: b._items.length,
      end: b._end,
      isReplayActive: !!window.__cr_replay_active
    };
  })()`);
  console.log('Initial state:', init);

  // STEP 2: START REPLAY ON 15M (Select recent bar e.g. 20 bars ago)
  console.log('\n--- Step 2: Starting Replay on 15m ---');
  const start = await evalInPage(`(() => {
    const api = window.TradingViewApi;
    const ctrl = api._replayApi._replayUIController;
    ctrl.enableReplayMode(true);
    ctrl.showReplayToolbar();

    const w = api._activeChartWidgetWV.value();
    const s = w.chartModel().mainSeries();
    const b = s.bars();

    // Select historical bar 25 bars ago
    const targetIdx = b._items.length - 25;
    const targetBar = b._items[targetIdx];
    const targetTimestamp = targetBar.value[0];

    ctrl._onPointSelected(w, targetTimestamp);

    return {
      selectedIdx: targetIdx,
      selectedTimestamp: targetTimestamp,
      selectedDate: new Date(targetTimestamp * 1000).toISOString(),
      barsEnd: b._end,
      totalBars: b._items.length,
      cutoffTimestamp: window.__cr_cutoff_timestamp,
      isReplayActive: window.__cr_replay_active
    };
  })()`);
  console.log('Replay started:', start);
  await sleep(1000);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_1_started_replay.png`);

  // STEP 3: AUTOPLAY TEST ON CURRENT TIMEFRAME
  console.log('\n--- Step 3: Testing Autoplay ---');
  await evalInPage(`(() => {
    const api = window.TradingViewApi;
    const ctrl = api._replayApi._replayUIController;
    ctrl.toggleAutoplay();
  })()`);
  console.log('Autoplay started. Running for 2.5s...');
  await sleep(2500);

  const playingCheck = await evalInPage(`(() => {
    const api = window.TradingViewApi;
    const ctrl = api._replayApi._replayUIController;
    const isPlaying = ctrl._replayManager.isAutoplayStarted().value();
    const b = api._activeChartWidgetWV.value().chartModel().mainSeries().bars();
    return {
      isPlaying,
      end: b._end,
      cutoffTimestamp: window.__cr_cutoff_timestamp
    };
  })()`);
  console.log('Autoplay progress:', playingCheck);

  // Pause autoplay
  await evalInPage(`(() => {
    const api = window.TradingViewApi;
    const ctrl = api._replayApi._replayUIController;
    ctrl.toggleAutoplay();
  })()`);
  console.log('Autoplay paused.');
  await sleep(500);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_2_autoplay_tested.png`);

  // STEP 4: SWITCH TO 5-MINUTE TIMEFRAME ("5")
  console.log('\n--- Step 4: Switching to 5-Minute Timeframe ("5") ---');
  await evalInPage(`window.TradingViewApi._activeChartWidgetWV.value().setResolution("5")`);
  console.log('Waiting for 5m data to load...');
  await sleep(3500);

  const check5m = await evalInPage(`(() => {
    const w = window.TradingViewApi._activeChartWidgetWV.value();
    const b = w.chartModel().mainSeries().bars();
    const item0 = b._items[0]?.value;
    const item1 = b._items[1]?.value;
    const lastVis = b._items[b._end - 1]?.value;
    return {
      resolution: w.resolution(),
      isReplayActive: window.__cr_replay_active,
      cutoffTimestamp: window.__cr_cutoff_timestamp,
      totalBars: b._items.length,
      end: b._end,
      isClamped: b._end < b._items.length,
      deltaSeconds: (item1 && item0) ? item1[0] - item0[0] : null,
      lastVisibleTime: lastVis ? new Date(lastVis[0] * 1000).toISOString() : null
    };
  })()`);
  console.log('5m status:', check5m);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_3_5m_resolution.png`);

  // STEP 5: SWITCH TO 1-MINUTE TIMEFRAME ("1")
  console.log('\n--- Step 5: Switching to 1-Minute Timeframe ("1") ---');
  await evalInPage(`window.TradingViewApi._activeChartWidgetWV.value().setResolution("1")`);
  console.log('Waiting for 1m data to load...');
  await sleep(3500);

  const check1m = await evalInPage(`(() => {
    const w = window.TradingViewApi._activeChartWidgetWV.value();
    const b = w.chartModel().mainSeries().bars();
    const item0 = b._items[0]?.value;
    const item1 = b._items[1]?.value;
    const lastVis = b._items[b._end - 1]?.value;
    return {
      resolution: w.resolution(),
      isReplayActive: window.__cr_replay_active,
      cutoffTimestamp: window.__cr_cutoff_timestamp,
      totalBars: b._items.length,
      end: b._end,
      isClamped: b._end < b._items.length,
      deltaSeconds: (item1 && item0) ? item1[0] - item0[0] : null,
      lastVisibleTime: lastVis ? new Date(lastVis[0] * 1000).toISOString() : null
    };
  })()`);
  console.log('1m status:', check1m);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_4_1m_resolution.png`);

  // STEP 6: SWITCH TO 1-HOUR TIMEFRAME ("60")
  console.log('\n--- Step 6: Switching to 1-Hour Timeframe ("60") ---');
  await evalInPage(`window.TradingViewApi._activeChartWidgetWV.value().setResolution("60")`);
  console.log('Waiting for 1h data to load...');
  await sleep(3500);

  const check1h = await evalInPage(`(() => {
    const w = window.TradingViewApi._activeChartWidgetWV.value();
    const b = w.chartModel().mainSeries().bars();
    const item0 = b._items[0]?.value;
    const item1 = b._items[1]?.value;
    const lastVis = b._items[b._end - 1]?.value;
    return {
      resolution: w.resolution(),
      isReplayActive: window.__cr_replay_active,
      cutoffTimestamp: window.__cr_cutoff_timestamp,
      totalBars: b._items.length,
      end: b._end,
      isClamped: b._end < b._items.length,
      deltaSeconds: (item1 && item0) ? item1[0] - item0[0] : null,
      lastVisibleTime: lastVis ? new Date(lastVis[0] * 1000).toISOString() : null
    };
  })()`);
  console.log('1h status:', check1h);

  // Step 1 bar forward on 1h
  console.log('Testing step forward on 1h...');
  await evalInPage(`window.TradingViewApi._replayApi._replayUIController.doStep()`);
  await sleep(500);

  const check1hStepped = await evalInPage(`(() => {
    const w = window.TradingViewApi._activeChartWidgetWV.value();
    const b = w.chartModel().mainSeries().bars();
    const lastVis = b._items[b._end - 1]?.value;
    return {
      end: b._end,
      lastVisibleTime: lastVis ? new Date(lastVis[0] * 1000).toISOString() : null
    };
  })()`);
  console.log('After 1h step:', check1hStepped);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_5_1h_stepped.png`);

  // STEP 7: SWITCH TO 1-DAY TIMEFRAME ("1D")
  console.log('\n--- Step 7: Switching to 1-Day Timeframe ("1D") ---');
  await evalInPage(`window.TradingViewApi._activeChartWidgetWV.value().setResolution("1D")`);
  console.log('Waiting for 1D data to load...');
  await sleep(3500);

  const check1D = await evalInPage(`(() => {
    const w = window.TradingViewApi._activeChartWidgetWV.value();
    const b = w.chartModel().mainSeries().bars();
    const item0 = b._items[0]?.value;
    const item1 = b._items[1]?.value;
    const lastVis = b._items[b._end - 1]?.value;
    return {
      resolution: w.resolution(),
      isReplayActive: window.__cr_replay_active,
      cutoffTimestamp: window.__cr_cutoff_timestamp,
      totalBars: b._items.length,
      end: b._end,
      isClamped: b._end < b._items.length,
      deltaSeconds: (item1 && item0) ? item1[0] - item0[0] : null,
      lastVisibleTime: lastVis ? new Date(lastVis[0] * 1000).toISOString() : null
    };
  })()`);
  console.log('1D status:', check1D);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_6_1D_resolution.png`);

  // STEP 8: VERIFY REPLAY RESOLUTIONS LIST IN DROPDOWN
  console.log('\n--- Step 8: Verifying Replay Resolutions List ---');
  const resList = await evalInPage(`(() => {
    const ctrl = window.TradingViewApi._replayApi._replayUIController;
    return {
      allReplayResolutions: ctrl._allReplayResolutions?.value?.(),
      replayResolutions: ctrl._replayResolutions?.value?.()
    };
  })()`);
  console.log('Replay Resolutions dropdown options:', resList);

  // STEP 9: CLEAN EXIT
  console.log('\n--- Step 9: Testing Clean Exit ---');
  await evalInPage(`(() => {
    const ctrl = window.TradingViewApi._replayApi._replayUIController;
    ctrl.requestCloseReplay();
  })()`);
  await sleep(1500);

  const afterExit = await evalInPage(`(() => {
    const w = window.TradingViewApi._activeChartWidgetWV.value();
    const b = w.chartModel().mainSeries().bars();
    const dialogs = document.querySelectorAll('#leaveReplayDialog, [data-dialog-name="confirm-dialog"]');
    return {
      resolution: w.resolution(),
      isReplayActive: !!window.__cr_replay_active,
      totalBars: b._items.length,
      end: b._end,
      isFullyRestored: b._end === b._items.length,
      dialogsRemaining: dialogs.length
    };
  })()`);
  console.log('State after exit:', afterExit);
  await captureScreenshot(`${ARTIFACT_DIR}/all_tf_7_restored_clean.png`);

  console.log('\n================================================================');
  const allPassed =
    check5m.isReplayActive && check5m.isClamped && check5m.deltaSeconds === 300 &&
    check1m.isReplayActive && check1m.isClamped && check1m.deltaSeconds === 60 &&
    check1h.isReplayActive && check1h.isClamped && check1h.deltaSeconds === 3600 &&
    check1D.isReplayActive && check1D.isClamped && check1D.deltaSeconds === 86400 &&
    afterExit.isFullyRestored && !afterExit.isReplayActive;

  if (allPassed) {
    console.log('🎉 ALL TIME FRAMES REPLAY TESTS PASSED WITH 100% SUCCESS!');
  } else {
    console.warn('⚠️ Some checks failed. Check output above.');
  }
  console.log('================================================================\n');
}

run().catch(console.error);
