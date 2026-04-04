import * as Blockly from "blockly";

const STORAGE_KEY = "bba_tutorial_seen_v1";

function getStoredTutorialSeen() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredTutorialSeen(seen) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // Ignore storage failures and keep the tutorial usable in-memory.
  }
}

function resolveTargetElement(selector) {
  if (!selector) {
    return null;
  }
  return document.querySelector(selector);
}

function resolveSpotlightRect(selector) {
  const element = resolveTargetElement(selector);
  if (!element) {
    return null;
  }
  const initialRect = element.getBoundingClientRect();
  const targetTop = Math.max(0, window.scrollY + initialRect.top - Math.max(96, (window.innerHeight - initialRect.height) / 2));
  const targetLeft = Math.max(0, window.scrollX + initialRect.left - Math.max(24, (window.innerWidth - initialRect.width) / 2));
  window.scrollTo({
    top: targetTop,
    left: targetLeft,
    behavior: "instant"
  });
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(8, rect.top - 8),
    left: Math.max(8, rect.left - 8),
    width: rect.width + 16,
    height: rect.height + 16
  };
}

function disposeTutorialDemoWorkspace(app) {
  if (app.tutorialDemoWorkspace) {
    app.tutorialDemoWorkspace.dispose();
    app.tutorialDemoWorkspace = null;
  }
}

function renderTutorialDemoWorkspace(app, step) {
  const demoContainer = document.getElementById("tutorial-demo-blockly");
  if (!demoContainer || !step?.demoBlocklyXml) {
    disposeTutorialDemoWorkspace(app);
    return;
  }

  disposeTutorialDemoWorkspace(app);
  app.tutorialDemoWorkspace = Blockly.inject(demoContainer, {
    readOnly: true,
    scrollbars: true,
    move: {
      drag: false,
      wheel: false,
      scrollbars: true
    },
    zoom: {
      controls: false,
      wheel: false,
      pinch: false
    },
    trashcan: false
  });

  const xml = Blockly.utils.xml.textToDom(step.demoBlocklyXml);
  Blockly.Xml.domToWorkspace(xml, app.tutorialDemoWorkspace);
}

export function initializeTutorialState(app) {
  app.state.tutorialSeen = getStoredTutorialSeen();
  app.state.activeTutorial = null;
  app.state.spotlightRect = null;
}

export function maybeStartLevelTutorial(app, level) {
  if (app.state.showModePicker || !level?.tutorialSteps?.length) {
    return;
  }
  const tutorialKey = `level:${level.id}`;
  if (app.state.tutorialSeen[tutorialKey]) {
    return;
  }
  app.state.activeTutorial = {
    key: tutorialKey,
    levelId: level.id,
    steps: level.tutorialSteps,
    currentIndex: 0
  };
  updateSpotlight(app);
}

export function startCurrentLevelTutorial(app, force = false) {
  const currentLevel = app.state.levels.find((level) => level.id === app.state.currentLevelId);
  if (!currentLevel?.tutorialSteps?.length) {
    return;
  }
  const tutorialKey = `level:${currentLevel.id}`;
  if (!force && app.state.tutorialSeen[tutorialKey]) {
    return;
  }
  app.state.activeTutorial = {
    key: tutorialKey,
    levelId: currentLevel.id,
    steps: currentLevel.tutorialSteps,
    currentIndex: 0
  };
  updateSpotlight(app);
}

export function closeTutorial(app, markSeen = true) {
  const tutorialKey = app.state.activeTutorial?.key;
  if (markSeen && tutorialKey) {
    app.state.tutorialSeen = { ...app.state.tutorialSeen, [tutorialKey]: true };
    saveStoredTutorialSeen(app.state.tutorialSeen);
  }
  app.state.activeTutorial = null;
  app.state.spotlightRect = null;
  disposeTutorialDemoWorkspace(app);
}

export function nextTutorialStep(app) {
  const activeTutorial = app.state.activeTutorial;
  if (!activeTutorial) {
    return;
  }
  if (activeTutorial.currentIndex >= activeTutorial.steps.length - 1) {
    closeTutorial(app, true);
    return;
  }
  activeTutorial.currentIndex += 1;
  updateSpotlight(app);
}

export function previousTutorialStep(app) {
  const activeTutorial = app.state.activeTutorial;
  if (!activeTutorial || activeTutorial.currentIndex === 0) {
    return;
  }
  activeTutorial.currentIndex -= 1;
  updateSpotlight(app);
}

export function updateSpotlight(app) {
  if (app.state.showModePicker) {
    app.state.spotlightRect = null;
    return;
  }
  const activeTutorial = app.state.activeTutorial;
  const step = activeTutorial?.steps?.[activeTutorial.currentIndex];
  app.state.spotlightRect = step ? resolveSpotlightRect(step.targetSelector) : null;
}

export function bindTutorialOverlay(app) {
  const overlay = document.getElementById("tutorial-overlay");
  if (!overlay) {
    return;
  }

  overlay.addEventListener("click", (event) => {
    const action = event.target.closest("[data-tutorial-action]")?.dataset.tutorialAction;
    if (!action) {
      return;
    }

    if (action === "next") {
      nextTutorialStep(app);
    } else if (action === "back") {
      previousTutorialStep(app);
    } else if (action === "skip") {
      closeTutorial(app, true);
    } else if (action === "choose-guided") {
      app.state.showModePicker = false;
      app.hooks.chooseInitialMode?.("guided");
    } else if (action === "choose-free-play") {
      app.state.showModePicker = false;
      app.hooks.chooseInitialMode?.("free-play");
    }

    app.syncUi();
  });

  window.addEventListener("resize", () => {
    updateSpotlight(app);
    app.syncUi();
  });
}

export function renderTutorialOverlay(app) {
  const overlay = document.getElementById("tutorial-overlay");
  if (!overlay) {
    return;
  }

  if (app.state.showModePicker) {
    disposeTutorialDemoWorkspace(app);
    overlay.classList.add("tutorial-overlay-active");
    overlay.innerHTML = `
      <div class="tutorial-scrim"></div>
      <div class="tutorial-card tutorial-card-centered">
        <p class="tutorial-step-count">Choose a starting mode</p>
        <h3>How do you want to begin?</h3>
        <p>Guided Levels teaches one concept at a time. Free Play drops you straight into the sandbox with the full current toolset.</p>
        <div class="tutorial-actions tutorial-actions-stacked">
          <button data-tutorial-action="choose-guided">Guided Levels</button>
          <button data-tutorial-action="choose-free-play">Free Play</button>
        </div>
      </div>
    `;
    return;
  }

  const activeTutorial = app.state.activeTutorial;
  if (!activeTutorial) {
    disposeTutorialDemoWorkspace(app);
    overlay.innerHTML = "";
    overlay.classList.remove("tutorial-overlay-active");
    return;
  }

  const step = activeTutorial.steps[activeTutorial.currentIndex];
  const rect = app.state.spotlightRect || resolveSpotlightRect(step.targetSelector);
  const spotlightStyle = rect
    ? `style="top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;"`
    : "";
  const hasDemo = Boolean(step.demoBlocklyXml);
  const demoTitle = step.demoTitle ? `<p class="tutorial-demo-title">${step.demoTitle}</p>` : "";
  const demoCaption = step.demoCaption ? `<p class="tutorial-demo-caption">${step.demoCaption}</p>` : "";

  overlay.classList.add("tutorial-overlay-active");
  overlay.innerHTML = `
    <div class="tutorial-scrim"></div>
    ${rect ? `<div class="tutorial-spotlight" ${spotlightStyle}></div>` : ""}
    <div class="tutorial-card ${hasDemo ? "tutorial-card-with-demo" : ""}">
      <p class="tutorial-step-count">Step ${activeTutorial.currentIndex + 1} of ${activeTutorial.steps.length}</p>
      <h3>${step.title}</h3>
      <p>${step.body}</p>
      ${hasDemo ? `
        <div class="tutorial-demo">
          ${demoTitle}
          <div id="tutorial-demo-blockly" class="tutorial-demo-blockly" style="${step.demoHeight ? `height:${step.demoHeight}px;` : ""}"></div>
          ${demoCaption}
        </div>
      ` : ""}
      <div class="tutorial-actions">
        <button data-tutorial-action="back" ${activeTutorial.currentIndex === 0 ? "disabled" : ""}>Back</button>
        <button data-tutorial-action="skip">Got It</button>
        <button data-tutorial-action="next">${activeTutorial.currentIndex === activeTutorial.steps.length - 1 ? "Finish" : "Next"}</button>
      </div>
    </div>
  `;
  renderTutorialDemoWorkspace(app, step);
}
