/*global _, player */

(function(global){
	"use strict";

	var Tools = {
		init: function(canvas){
			this.canvas = canvas;
			this.layersDisplayContainer = document.getElementById('layers-display');
			this.addDisplay = document.getElementById('add-layer');
			this.palette = document.getElementById('palette');
			this.toolbar = document.getElementById('toolbar');
			this.gradient = document.getElementById('color-canvas');
			this.gradientContext = this.gradient.getContext('2d');
			this.toolbox = this.initToolbox();
			this.download = {
				elem: document.getElementById('trigger-download'),
			},
			this.upload = {
				fileReader: new FileReader(),
				input: document.getElementById('trigger-upload'),
			},
			this.addListeners();
			this.initGradient();
			canvas.SELECTED_TOOL = this.toolbox.pen;
			return this;
		},

		initToolbox: function(){
			var toolbox = {
				color: "#df4b26",
				pen: {
					elem: document.getElementById('pen'),
					selected: true,
					radius: $(document.getElementById('pen-radius')).val(),
					input: document.getElementById('pen-radius'),
				},
				line: {
					elem: document.getElementById('line'),
					selected: false,
					radius: $(document.getElementById('line-radius')).val(),
					input: document.getElementById('line-radius'),
				},
				rubber:{
					elem: document.getElementById('rubber'),
					selected: false,
					radius: $(document.getElementById('rubber-radius')).val(),
					input: document.getElementById('rubber-radius'),
				},
				square:{
					elem: document.getElementById('square'),
					selected: false,
					radius: $(document.getElementById('square-radius')).val(),
					input: document.getElementById('square-radius'),
					checkbox: document.getElementById('square-fill-input'),
					fill: document.getElementById('square-fill-input').checked,
				},
				round:{
					elem: document.getElementById('round'),
					selected: false,
					radius: $(document.getElementById('round-radius')).val(),
					input: document.getElementById('round-radius'),
					checkbox: document.getElementById('round-fill-input'),
					fill: document.getElementById('round-fill-input').checked,
				},
				hexaPicker:{
					elem: document.getElementById('hexa-trigger'),
					input: document.getElementById('hexa-picker'),
				},
				hslPicker:{
					elem: document.getElementById('hsl-trigger'),
					inputs: document.getElementsByClassName('hsl-picker'),
				},
				verticalSymmetry: {
					selected: document.getElementById('vertical-symmetry-input').checked,
					elem: document.getElementById('vertical-symmetry-input'),
				},
				horizontalSymmetry: {
					selected: document.getElementById('horizontal-symmetry-input').checked,
					elem: document.getElementById('horizontal-symmetry-input'),
				},
			}
			return toolbox;
		},

		addListeners: function(){
			this.toolbox.pen.elem.addEventListener('click', this.handleClickPen);
			this.toolbox.line.elem.addEventListener('click', this.handleClickLine);
			this.toolbox.square.elem.addEventListener('click', this.handleClickSquare);
			this.toolbox.round.elem.addEventListener('click', this.handleClickRound);
			this.toolbox.rubber.elem.addEventListener('click', this.handleClickRubber);
			this.toolbox.hexaPicker.elem.addEventListener('click', this.setHexaColor);
			this.toolbox.hslPicker.elem.addEventListener('click', this.setHslColor);
			this.toolbox.verticalSymmetry.elem.addEventListener('click', this.setVerticalSymmetry);
			this.toolbox.horizontalSymmetry.elem.addEventListener('click', this.setHorizontalSymmetry);
			$(this.toolbox.pen.input).change(this.setPenValue);
			$(this.toolbox.line.input).change(this.setLineValue);
			$(this.toolbox.rubber.input).change(this.setRubberValue);
			$(this.toolbox.square.input).change(this.setSquareValue);
			$(this.toolbox.square.checkbox).change(this.setSquareFillValue);
			$(this.toolbox.round.input).change(this.setRoundValue);
			$(this.toolbox.round.checkbox).change(this.setRoundFillValue);
			$(this.upload.input).change(this.uploadImage);
			this.canvas.canvas.addEventListener('drop', this.uploadDropImage);
			this.canvas.canvas.addEventListener('dragover', this.handleDragOver);
			this.gradient.addEventListener('click', this.hadnleClickGradient);
			this.download.elem.addEventListener('click', this.saveImage);
		},

		setVerticalSymmetry: function(event){
			Tools.toolbox.verticalSymmetry.selected = !Tools.toolbox.verticalSymmetry.selected;
		},

		setHorizontalSymmetry: function(event){
			Tools.toolbox.horizontalSymmetry.selected = !Tools.toolbox.horizontalSymmetry.selected;
		},

		uploadDropImage: function(event){
			// event.stopPropagation();
			event.preventDefault();
			Tools.upload.fileReader.onload = function(){
				var dataURL = Tools.upload.fileReader.result;
				var imageObj = new Image();
				imageObj.onload = function(){
					Canvas.ctx.drawImage(this, 0, 0);
				}
				imageObj.src = dataURL;
			}
			Tools.upload.fileReader.readAsDataURL(event.dataTransfer.files[0]);
		},

		handleDragOver: function(event){
			event.stopPropagation();
			event.preventDefault();
		},

		uploadImage: function(event){
			Tools.upload.fileReader.onload = function(){
				var dataURL = Tools.upload.fileReader.result;
				var imageObj = new Image();
				imageObj.onload = function(){
					Canvas.ctx.drawImage(this, 0, 0);
				}
				imageObj.src = dataURL;
			}
			Tools.upload.fileReader.readAsDataURL(event.target.files[0]);
		},

		saveImage: function(){
			for (var i = Canvas.layers_elem.length - 1; i >= 0; i--) {
				console.log(Canvas.layers_elem[i]);
			}
			var dataURL = Tools.canvas.canvas.toDataURL('image/png');
			Tools.download.elem.href = dataURL;
			
		},

		setHexaColor: function(event){
			// !! AJOUTER UNE REGEX 
			Tools.toolbox.color = $(Tools.toolbox.hexaPicker.input).val();
			Tools.palette.style.backgroundColor = $(Tools.toolbox.hexaPicker.input).val();
		},

		setHslColor: function(event){
			var hsl = Tools.toolbox.hslPicker.inputs;
			var hsl_string = 'hsl(' + $(hsl[0]).val() + ', ' + $(hsl[1]).val() + '%, ' + $(hsl[2]).val() + '%)';
			Tools.toolbox.color = hsl_string;
			Tools.palette.style.backgroundColor = hsl_string;
		},

		initGradient: function(){
			var ctx = this.gradient.getContext('2d');
			var grd = ctx.createLinearGradient(0.000, 150.000, 300.000, 150.000);
			grd.addColorStop(0.000, 'rgba(255, 0, 0, 1.000)');
			grd.addColorStop(0.150, 'rgba(255, 0, 255, 1.000)');
			grd.addColorStop(0.330, 'rgba(0, 0, 255, 1.000)');
			grd.addColorStop(0.490, 'rgba(0, 255, 255, 1.000)');
			grd.addColorStop(0.670, 'rgba(0, 255, 0, 1.000)');
			grd.addColorStop(0.840, 'rgba(255, 255, 0, 1.000)');
			grd.addColorStop(1.000, 'rgba(255, 0, 0, 1.000)');
			ctx.fillStyle = grd;
			ctx.fillRect(0, 0, 300.000, 300.000);
			var grd = ctx.createLinearGradient(150.000, 0.000, 150.000, 300.000);
			grd.addColorStop(0.000, 'rgba(0, 0, 0, 1.000)');
			grd.addColorStop(0.471, 'rgba(255, 255, 255, 0.000)');
			ctx.fillStyle = grd;
			ctx.fillRect(0, 0, 300.000, 300.000);
		},

		setPenValue: function(event){
			console.log('blah');
			Tools.toolbox.pen.radius = $(event.target).val();
		},

		setRubberValue: function(event){
			console.log('blah');
			Tools.toolbox.rubber.radius = $(event.target).val();
		},

		setSquareFillValue: function(){
			Tools.toolbox.square.fill = !Tools.toolbox.square.fill;
		},

		setRoundFillValue: function(){
			Tools.toolbox.round.fill = !Tools.toolbox.round.fill;
		},

		setLineValue: function(event){
			Tools.toolbox.line.radius = $(event.target).val();
		},

		setSquareValue: function(event){
			Tools.toolbox.square.radius = $(event.target).val();
		},

		setRoundValue: function(event){
			Tools.toolbox.round.radius = $(event.target).val();
		},

		handleClickPen: function(event){
			Tools.cleanToolsDisplay();
			Canvas.SELECTED_TOOL = Tools.toolbox.pen;
			$(event.target).toggleClass('selected');
		},

		handleClickLine: function(event){
			Tools.cleanToolsDisplay();
			Canvas.SELECTED_TOOL = Tools.toolbox.line;
			Canvas.NEW_LINE = true;
			$(event.target).toggleClass('selected');
		},

		handleClickSquare: function(event){
			Tools.cleanToolsDisplay();
			Canvas.SELECTED_TOOL = Tools.toolbox.square;
			Canvas.NEW_LINE = true;
			$(event.target).toggleClass('selected');
		},

		handleClickRubber: function(event){
			Tools.cleanToolsDisplay();
			Canvas.SELECTED_TOOL = Tools.toolbox.rubber;
			$(event.target).toggleClass('selected');
		},

		handleClickRound: function(event){
			Tools.cleanToolsDisplay();
			Canvas.SELECTED_TOOL = Tools.toolbox.round;
			Canvas.NEW_LINE = true;
			$(event.target).toggleClass('selected');
		},

		hadnleClickGradient: function(event){
			var x = event.pageX - this.offsetLeft;
			var y = event.pageY - this.offsetTop;
			var pixel = Tools.gradientContext.getImageData(x, y, 1, 1);
			var rgb = pixel.data;
			var rgb_string = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
			Tools.toolbox.color = rgb_string;
			Tools.palette.style.backgroundColor = rgb_string;
		},

		cleanToolsDisplay: function(){
			var tools = document.getElementsByClassName('tool');
			for (var i = tools.length - 1; i >= 0; i--){
				$(tools[i]).removeClass('selected');
			}
		}
	}

	window.Tools = Tools;
}());