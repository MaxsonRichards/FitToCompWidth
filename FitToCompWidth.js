ui.setTitle("Fit to Comp Width");
ui.setMargins(10, 10, 10, 10);
ui.setSpaceBetween(7);
ui.setMinimumWidth(300);
ui.setMinimumHeight(250);

var titleLabel = new ui.Label("");
titleLabel.setMarkdown("### Fit to Comp Width");

var selectionValue = new ui.Label("—");
var layerWidthValue = new ui.Label("—");
var compWidthValue = new ui.Label("—");
var targetScaleValue = new ui.Label("—");
var statusLabel = new ui.Label("Select a layer");
var fitButton = new ui.Button("Fit Width");

selectionValue.setAlignment(2);
layerWidthValue.setAlignment(2);
compWidthValue.setAlignment(2);
targetScaleValue.setAlignment(2);

selectionValue.setFixedWidth(140);
layerWidthValue.setFixedWidth(140);
compWidthValue.setFixedWidth(140);
targetScaleValue.setFixedWidth(140);

statusLabel.setAlignment(1);

fitButton.setMinimumHeight(32);
fitButton.setFontSize(13);
fitButton.setEnabled(false);
fitButton.setToolTip("Scale the selected layer proportionally to the composition width");

function makeRow(name, valueWidget) {
    var label = new ui.Label(name);
    var layout = new ui.HLayout();

    layout.add(label);
    layout.addStretch();
    layout.add(valueWidget);

    return layout;
}

function formatPixels(value) {
    if (Math.abs(value - Math.round(value)) < 0.001) {
        return Math.round(value) + " px";
    }

    return value.toFixed(2) + " px";
}

function formatPercent(value) {
    return (value * 100).toFixed(4) + "%";
}

function getScalableSelection() {
    var selection = api.getSelection();
    var result = [];

    for (var i = 0; i < selection.length; i++) {
        if (api.isTransform(selection[i])) {
            result.push(selection[i]);
        }
    }

    return result;
}

function refreshUI() {
    var comp = api.getActiveComp();
    var selection = getScalableSelection();

    if (!comp || !api.layerExists(comp)) {
        selectionValue.setText("—");
        layerWidthValue.setText("—");
        compWidthValue.setText("—");
        targetScaleValue.setText("—");
        statusLabel.setText("No active composition");
        fitButton.setText("Fit Width");
        fitButton.setEnabled(false);
        return;
    }

    var compWidth = api.get(comp, "resolution.x");
    compWidthValue.setText(formatPixels(compWidth));

    if (selection.length === 0) {
        selectionValue.setText("—");
        layerWidthValue.setText("—");
        targetScaleValue.setText("—");
        statusLabel.setText("Select a layer");
        fitButton.setText("Fit Width");
        fitButton.setEnabled(false);
        return;
    }

    if (selection.length > 1) {
        selectionValue.setText(selection.length + " layers");
        layerWidthValue.setText("Multiple");
        targetScaleValue.setText("Per layer");
        statusLabel.setText("Ready");
        fitButton.setText("Fit " + selection.length + " Layers");
        fitButton.setEnabled(true);
        return;
    }

    var layerId = selection[0];
    var bbox = api.getBoundingBox(layerId, true);

    selectionValue.setText(api.getNiceName(layerId));

    if (!bbox || bbox.width <= 0) {
        layerWidthValue.setText("—");
        targetScaleValue.setText("—");
        statusLabel.setText("Layer has no width");
        fitButton.setText("Fit Width");
        fitButton.setEnabled(false);
        return;
    }

    var scaleX = api.get(layerId, "scale.x");
    var factor = compWidth / bbox.width;
    var targetScale = scaleX * factor;
    var difference = Math.abs(bbox.width - compWidth);

    layerWidthValue.setText(formatPixels(bbox.width));
    targetScaleValue.setText(formatPercent(targetScale));

    if (difference < 0.001) {
        statusLabel.setText("Already fits composition width");
        fitButton.setText("Already Fits");
        fitButton.setEnabled(false);
    } else {
        statusLabel.setText("Ready");
        fitButton.setText("Fit Width");
        fitButton.setEnabled(true);
    }
}

fitButton.onClick = function () {
    var comp = api.getActiveComp();
    var selection = getScalableSelection();

    if (!comp || selection.length === 0) {
        return;
    }

    var compWidth = api.get(comp, "resolution.x");

    for (var i = 0; i < selection.length; i++) {
        var layerId = selection[i];
        var bbox = api.getBoundingBox(layerId, true);

        if (!bbox || bbox.width <= 0) {
            continue;
        }

        var scaleX = api.get(layerId, "scale.x");
        var scaleY = api.get(layerId, "scale.y");
        var factor = compWidth / bbox.width;

        api.set(layerId, {
            "scale.x": scaleX * factor,
            "scale.y": scaleY * factor
        });
    }

    refreshUI();
};

function Callbacks() {
    this.onSelectionChanged = function () {
        refreshUI();
    };

    this.onCompChanged = function () {
        refreshUI();
    };

    this.onSceneChanged = function () {
        refreshUI();
    };

    this.onAttrChanged = function (layerId, attrId) {
        var comp = api.getActiveComp();
        var selection = api.getSelection();

        if (layerId === comp || selection.indexOf(layerId) !== -1) {
            refreshUI();
        }
    };
}

var infoLayout = new ui.VLayout();
infoLayout.setSpaceBetween(5);

infoLayout.add(makeRow("Selected", selectionValue));
infoLayout.add(makeRow("Layer Width", layerWidthValue));
infoLayout.add(makeRow("Comp Width", compWidthValue));
infoLayout.add(makeRow("Target Scale", targetScaleValue));

var callbackObj = new Callbacks();

ui.add(titleLabel);
ui.add(infoLayout);
ui.addSpacing(3);
ui.add(statusLabel);
ui.addSpacing(2);
ui.add(fitButton);

ui.addCallbackObject(callbackObj);

refreshUI();
ui.show();
