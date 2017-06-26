if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
	alert('The File APIs are not fully supported in this browser.');
}

(function(){
	"use strict";

	var Canvas = {
		init: function(){
			this.canvasContainer = document.getElementById('canvas-container');
			this.canvas = document.getElementById('main-canvas');
			this.canvasVertical = document.getElementById('canvas-vertical');
			this.ctxVertical = this.canvasVertical.getContext('2d');
			this.ctx = this.canvas.getContext('2d');
			this.tools = Tools.init(this);
			this.PAINTING = false;
			this.ERASING = false;
			this.tmp_coord;
			this.tmp_coordV;
			this.half_x = this.canvas.width / 2;
			this.half_y = this.canvas.height / 2;
			this.layers = {
				main:{
					elem: document.getElementById('main-canvas-display'),
					ctx: document.getElementById('main-canvas-display').getContext('2d'),
				},
				trigger: document.getElementById('add-layer'),
			},
			this.layers_elem = document.getElementsByClassName('layer');
			this.display = document.getElementById('main-canvas-display');
			this.views = document.getElementsByClassName('view-layer');
			this.addListeners();
			setInterval(this.refreshLayersDisplay, 1000);
		},

		refreshLayersDisplay: function(){
			var dataURL = Canvas.canvas.toDataURL();
			var imageObj = new Image();
			imageObj.onload = function(){
				var ctx = Canvas.display.getContext('2d');
				ctx.drawImage(this, 0, 0, 50, 50);
			}
			imageObj.src = dataURL;
		},

		addListeners: function(){
			$(this.canvas).mousedown(this.startPaint);
			$(this.canvas).mousemove(this.Paint);
			$(this.canvas).mouseup(this.stopPaint);
			$(this.canvas).mouseleave(this.stopPaint);
			this.layers.trigger.addEventListener('click', this.addLayer);
			this.layers.main.elem.addEventListener('click', this.selectLayer);
			for (var i = this.views.length - 1; i >= 0; i--) {
				this.views[i].addEventListener('click', this.displayLayer);
			}
		},

		displayLayer: function(event){
			var canvas_id = $(event.target).data().canvas;
			var canvas = document.getElementById(canvas_id);
			$(canvas).toggleClass('no-display');
		},

		selectLayer: function(event){
			Canvas.cleanSelected();
			var canvas_id = $(event.target).data().canvas;
			var canvas = document.getElementById(canvas_id);
			$(event.target).addClass('selected');
			Canvas.canvas = canvas;
			Canvas.ctx = canvas.getContext('2d');
			Canvas.display = event.target;
			Canvas.addListeners();
		},

		addLayer: function(event){
			Canvas.cleanSelected();
			var zIndex = Canvas.layers_elem.length;
			zIndex++;
			var id = 'layer' + zIndex;
			jQuery('<canvas>', {
				id: id,
				class: 'layer',
				zIndex: zIndex,
			}).appendTo('#canvas-container');
			jQuery('<canvas>', {
				id: id + '-display',
				class: 'layer-display selected',
				data: {
					canvas: id,
				},
			}).appendTo('#layers-display-container');
			jQuery('<input>', {
				type: 'checkbox',
				class: 'view-layer',
				checked: true,
				data: {
					canvas: id,
				},
			}).appendTo('#checkbox-container');
			var display = document.getElementById(id + '-display');
			var canvas = document.getElementById(id);
			canvas.setAttribute("height", Canvas.canvas.height);
			canvas.setAttribute("width", Canvas.canvas.width);
			display.setAttribute("height", 50);
			display.setAttribute("width", 50);
			display.addEventListener('click', Canvas.selectLayer);
			Canvas.canvas = canvas;
			Canvas.ctx = canvas.getContext('2d');
			Canvas.display = display;
			Canvas.addListeners();
		},

		cleanSelected: function(){
			var displays = document.getElementsByClassName('layer-display');
			for (var i = displays.length - 1; i >= 0; i--){
				$(displays[i]).removeClass('selected');
			}
		},

		startPaint: function(event){
			var x = event.pageX - this.offsetLeft;
			var y = event.pageY - this.offsetTop;
			switch(Canvas.SELECTED_TOOL.elem.id){
				case 'pen':
				Canvas.PAINTING = true;
				Canvas.NEW_LINE = true;
				break;
				case 'line':
				Canvas.drawLine(x, y);
				break;
				case 'square':
				Canvas.drawSquare(x, y);
				break;
				case 'round':
				Canvas.drawCircle(x, y);
				break;
				case 'rubber':
				Canvas.ERASING = true;
				break;
			}
			Canvas.mergeSymmetry();
		},

		drawLine: function(x, y){
			if(this.NEW_LINE){
				this.ctx.beginPath();
				this.ctx.strokeStyle = Tools.toolbox.color;
				this.ctx.lineJoin = "round";
				this.ctx.lineCap = "round";
				this.ctx.lineWidth = Tools.toolbox.line.radius;
				this.ctx.moveTo(x, y);
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = false;
				}
			}
			else{
				this.ctx.lineTo(x, y);
				this.ctx.stroke();
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = true;
				}
			}
			if(Tools.toolbox.verticalSymmetry.selected || Tools.toolbox.horizontalSymmetry.selected){
				Canvas.lineSymmetry(x, y);
			}
		},

		lineSymmetry: function(x, y){
			if(Tools.toolbox.verticalSymmetry.selected){
				var half = this.half_x - x;
				x = this.half_x + half;
			}
			if(Tools.toolbox.horizontalSymmetry.selected){
				var half = this.half_y - y;
				y = this.half_y + half;
			}
			if(this.NEW_LINE){
				this.ctxVertical.beginPath();
				this.ctxVertical.strokeStyle = Tools.toolbox.color;
				this.ctxVertical.lineJoin = "round";
				this.ctxVertical.lineCap = "round";
				this.ctxVertical.lineWidth = Tools.toolbox.line.radius;
				this.ctxVertical.moveTo(x, y);
				this.NEW_LINE = false;
			}
			else{
				this.ctxVertical.lineTo(x, y);
				this.ctxVertical.stroke();
				this.NEW_LINE = true;
			}
		},

		Paint: function(event){
			var x = event.pageX - this.offsetLeft;
			var y = event.pageY - this.offsetTop;
			if(Canvas.PAINTING){
				Canvas.drawFree(x, y);
			}
			if(Canvas.ERASING){
				Canvas.erase(x, y);
			}
		},

		drawFree: function(x, y){
			if(this.NEW_LINE){
				this.ctx.beginPath();
				this.ctx.strokeStyle = Tools.toolbox.color;
				this.ctx.lineJoin = "round";
				this.ctx.lineCap = "round";
				this.ctx.lineWidth = Tools.toolbox.pen.radius;
				this.ctx.moveTo(x, y);
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = false;
				}
			}
			else{
				this.ctx.lineTo(x, y);
				this.ctx.stroke();
			}
			if(Tools.toolbox.verticalSymmetry.selected || Tools.toolbox.horizontalSymmetry.selected){
				Canvas.drawSymmetry(x, y);
			}
		},

		drawSymmetry: function(x, y){
			if(Tools.toolbox.verticalSymmetry.selected){
				var half = this.half_x - x;
				x = this.half_x + half;
			}
			if(Tools.toolbox.horizontalSymmetry.selected){
				var half = this.half_y - y;
				y = this.half_y + half;
			}
			if(this.NEW_LINE){
				this.ctxVertical.beginPath();
				this.ctxVertical.strokeStyle = Tools.toolbox.color;
				this.ctxVertical.lineJoin = "round";
				this.ctxVertical.lineCap = "round";
				this.ctxVertical.lineWidth = Tools.toolbox.pen.radius;
				this.ctxVertical.moveTo(x, y);
				this.NEW_LINE = false;
			}
			else{
				this.ctxVertical.lineTo(x, y);
				this.ctxVertical.stroke();
			}
		},

		erase: function(x, y){
			var half_radius = Math.floor(Tools.toolbox.rubber.radius / 2);
			var tmp_x = x - half_radius;
			var tmp_y = y - half_radius;
			this.ctx.clearRect(tmp_x, tmp_y, Tools.toolbox.rubber.radius, Tools.toolbox.rubber.radius);
			this.ctxVertical.clearRect(tmp_x, tmp_y, Tools.toolbox.rubber.radius, Tools.toolbox.rubber.radius);
			if(Tools.toolbox.verticalSymmetry.selected || Tools.toolbox.horizontalSymmetry.selected){
				Canvas.eraseSymmetry(x, y);
			}
		},

		eraseSymmetry: function(x, y){
			if(Tools.toolbox.verticalSymmetry.selected){
				var half = this.half_x - x;
				x = this.half_x + half;
			}
			if(Tools.toolbox.horizontalSymmetry.selected){
				var half = this.half_y - y;
				y = this.half_y + half;
			}
			var half_radius = Math.floor(Tools.toolbox.rubber.radius / 2);
			var tmp_x = x - half_radius;
			var tmp_y = y - half_radius;
			this.ctx.clearRect(tmp_x, tmp_y, Tools.toolbox.rubber.radius, Tools.toolbox.rubber.radius);
			this.ctxVertical.clearRect(tmp_x, tmp_y, Tools.toolbox.rubber.radius, Tools.toolbox.rubber.radius);
		},

		drawSquare: function(x, y){
			if(this.NEW_LINE){
				this.ctx.beginPath();
				this.ctx.lineJoin = "square";
				this.ctx.lineCap = "square";
				this.ctx.strokeStyle = Tools.toolbox.color;
				this.ctx.fillStyle = Tools.toolbox.color;
				this.ctx.lineWidth = Tools.toolbox.square.radius;
				this.tmp_coord = [x, y];
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = false;
				}
			}
			else{
				this.ctx.lineJoin = "square";
				this.ctx.lineCap = "square";
				this.ctx.rect(this.tmp_coord[0], this.tmp_coord[1], 
					x -this.tmp_coord[0], y - this.tmp_coord[1]);
				if(Tools.toolbox.square.fill){
					this.ctx.fill();
				}
				else{
					this.ctx.stroke();
				}
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = true;
					this.tmp_coord = null;
				}
			}
			if(Tools.toolbox.verticalSymmetry.selected || Tools.toolbox.horizontalSymmetry.selected){
				Canvas.drawSquareSymmetry(x, y);
			}
		},

		drawSquareSymmetry: function(x, y){
			if(Tools.toolbox.verticalSymmetry.selected){
				var half = this.half_x - x;
				x = this.half_x + half;
			}
			if(Tools.toolbox.horizontalSymmetry.selected){
				var half = this.half_y - y;
				y = this.half_y + half;
			}
			if(this.NEW_LINE){
				this.ctxVertical.beginPath();
				this.ctxVertical.lineJoin = "square";
				this.ctxVertical.lineCap = "square";
				this.ctxVertical.strokeStyle = Tools.toolbox.color;
				this.ctxVertical.fillStyle = Tools.toolbox.color;
				this.ctxVertical.lineWidth = Tools.toolbox.square.radius;
				this.tmp_coordV = [x, y];
				this.NEW_LINE = false;
			}
			else{
				this.ctxVertical.lineJoin = "square";
				this.ctxVertical.lineCap = "square";
				this.ctxVertical.rect(this.tmp_coordV[0], this.tmp_coordV[1], 
					x -this.tmp_coordV[0], y - this.tmp_coordV[1]);
				if(Tools.toolbox.square.fill){
					this.ctxVertical.fill();
				}
				else{
					this.ctxVertical.stroke();
				}
				this.NEW_LINE = true;
				this.tmp_coordV = null;
			}
		},

		mergeSymmetry: function(){
			var dataURL = this.canvasVertical.toDataURL();
			var imageObj = new Image();
			console.log(Canvas.canvas);
			imageObj.onload = function(){
				Canvas.ctx.drawImage(this, 0, 0);
			}
			imageObj.src = dataURL;
			this.ctxVertical.clearRect(0, 0, this.canvas.width, this.canvas.height);
		},

		drawCircle: function(x, y){
			if(this.NEW_LINE){
				this.ctx.beginPath();
				this.ctx.strokeStyle = Tools.toolbox.color;
				this.ctx.fillStyle = Tools.toolbox.color;
				this.ctx.lineWidth = Tools.toolbox.round.radius;
				this.tmp_coord = [x, y];
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = false;
				}
			}
			else{
				var tmp_a = this.tmp_coord[0] - x;
				tmp_a *= tmp_a;
				var tmp_b = this.tmp_coord[1] - y;
				tmp_b *= tmp_b;
				var radius = Math.sqrt(tmp_a + tmp_b)
				this.ctx.arc(this.tmp_coord[0], this.tmp_coord[1], radius, 0, 2*Math.PI);
				if(Tools.toolbox.round.fill){
					this.ctx.fill();
				}
				else{
					this.ctx.stroke();
				}
				if(!Tools.toolbox.verticalSymmetry.selected && !Tools.toolbox.horizontalSymmetry.selected){
					this.NEW_LINE = true;
					this.tmp_coord = null;
				}
			}
			if(Tools.toolbox.verticalSymmetry.selected || Tools.toolbox.horizontalSymmetry.selected){
				this.drawCircleSymmetry(x, y);
			}
		},

		drawCircleSymmetry: function(x, y){
			if(Tools.toolbox.verticalSymmetry.selected){
				var half = this.half_x - x;
				x = this.half_x + half;
			}
			if(Tools.toolbox.horizontalSymmetry.selected){
				var half = this.half_y - y;
				y = this.half_y + half;
			}
			if(this.NEW_LINE){
				this.ctxVertical.beginPath();
				this.ctxVertical.strokeStyle = Tools.toolbox.color;
				this.ctxVertical.fillStyle = Tools.toolbox.color;
				this.ctxVertical.lineWidth = Tools.toolbox.round.radius;
				this.tmp_coordV = [x, y];
				this.NEW_LINE = false;
			}
			else{
				var tmp_a = this.tmp_coordV[0] - x;
				tmp_a *= tmp_a;
				var tmp_b = this.tmp_coordV[1] - y;
				tmp_b *= tmp_b;
				var radius = Math.sqrt(tmp_a + tmp_b)
				this.ctxVertical.arc(this.tmp_coordV[0], this.tmp_coordV[1], radius, 0, 2*Math.PI);
				if(Tools.toolbox.round.fill){
					this.ctxVertical.fill();
				}
				else{
					this.ctxVertical.stroke();
				}
				this.NEW_LINE = true;
				this.tmp_coordV = null;
			}
		},

		stopPaint: function(event){
			Canvas.PAINTING = false;
			Canvas.ERASING = false;
			Canvas.mergeSymmetry();
		},
	}

	document.addEventListener('DOMContentLoaded', function () {
		Canvas.init();
	});
	window.Canvas = Canvas;
}())

