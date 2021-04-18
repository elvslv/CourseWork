define('ExecutionUnitCommands', ['jQuery', 'jQueryUI', 'jQueryInherit', 'Misc', 'Exceptions'], function() {
	var Exceptions = require('Exceptions');
	var IncorrectInput = Exceptions.IncorrectInput;
	var InternalError = Exceptions.InternalError;

	var CommandArgument = $.inherit({
		__constructor: function(expression, arguments, argumentValues, problem) {
			this.domObject = undefined;
			this.arguments = arguments ? arguments.clone() : [];
			this.argumentValues = argumentValues ? argumentValues : {};
			this.problem = problem;
		},

		initializeArgumentDomObject: function(command, index) {
			this.domObject = $(command).children('.testFunctionArgument:eq(' + index + ')');
		},

		updateValueInDomObject: function() {
			if (!this.domObject || this.expression == undefined) {
				throw new InternalError('updateValueInDomObject: Can\'t update values');
			}

			this.setValue(this.expression);
		},

		addArguments: function() {
			return;
		},

		findValue: function() {
			return;
		},

		updateInterface: function(newState, blocklyField){
			switch (newState) {
				case 'START_EXECUTION':
					blocklyField.saveOriginalValue();
					this.field_ = blocklyField;
					break;
				case 'FINISH_EXECUTION':
					blocklyField.restoreOriginalValue();
					break;
			}
		},

		setDefault: function(){
			// $(this.domObject).removeAttr('disabled');
			// $(this.domObject).children().removeAttr('disabled');
		},

		getExpression: function() {
			return this.expression;
		},

		setArgumentValues: function(argumentValues) {
			this.argumentValues = $.extend(true, {}, argumentValues);
		},
	});

	var CommandArgumentSelect = $.inherit(CommandArgument, {
		__constructor : function(options, expression, arguments, argumentValues, problem) {
			this.options = options.clone();
			this.__base(expression, arguments, argumentValues, problem);
			this.expression = expression != undefined ? this.options[0][0] : expression;
		},

		clone: function() {
			return new CommandArgumentSelect(this.options, this.expression, this.arguments, this.argumentValues, this.problem);
		},

		generateDomObject: function(prev, callback, problem, value) {
			var container = $('<span class = "testFunctionArgument"></span>').insertAfter(prev);
			var select = $('<select class = "selectExpression"></select>').appendTo(container);

			for (var i = 0; i < this.options.length; ++i) {
				$(select).append('<option value="' + this.options[i][0] + '">' + this.options[i][1] + '</option><br>');
			}

			var valueInput = $('<input class = "selectValue"></input>').appendTo(container);
			$(valueInput).hide();

			this.callback = callback;
			this.problem = problem;

			this.domObject = container;
			this.updateCallbacks();

			if (this.arguments && this.arguments.length) {
				this.addArguments(this.arguments, true);
			}

			if (value) {
				this.setValue(value);
			}
			return this.domObject;
		},

		// initializeArgumentDomObject: function(command, index) {
		// 	this.__base(command, index);
		// 	if (this.domObject.length) {
		// 		this.expression = $(this.domObject).children('select').children('option:selected').val();
		// 		this.updateCallbacks();
		// 	}
		// },

		// updateCallbacks: function() {
		// 	var self = this;
		// 	$(this.domObject).children('select').off('change').on('change', function(){
		// 		self.expression = $(this).children('select').children('option:selected').val();
		// 		self.problem.updated();
		// 	});
		// },

		updateInterface: function(newState, blocklyField){
			this.__base(newState, blocklyField);
			switch (newState) {
				case 'START_EXECUTION':
					var value = this.getValue(this.argumentValues);
					for (var i = 0; i < this.options.length; ++i) {
						if (this.options[i][0] == value || this.options[i][1] == value) {
							value = this.options[i][1];
							break;
						}
					}
					this.field_.setRawText(value.toString());
					break;
				case 'FINISH_EXECUTION':
					break;
			}
		},

		findValue: function(value) {
			for (var i = 0; i < this.options.length; ++i) {
				if (this.options[i][0] == value || this.options[i][1] == value) {
					var value = this.options[i][0];
					if (checkNumber(value))
						return value.toString()
					else
						return '\"' + value + '\"';
				}
			}

			return undefined;
		},

		addArguments: function(args, clear) {
			if (clear) {
				$(this.domObject).children('select').children(':gt(' + (this.options.length - 1) + ')').remove();
				this.arguments = [];
			}

			for (var i = 0; args && i < args.length; ++i) {
				$(this.domObject).children('select').append('<option value="' + args[i] + '">' + args[i] + '</option><br>');
				this.arguments.push(args[i]);
			}
		},

		setValue: function(value, afterDomCreation) {
			this.expression = value;
			// $(this.domObject).children('select').val(value);
			if (this.field_)
				this.field_.setRawText(value);
		},

		getValue: function(args) {
			var value = this.expression;
			return (args == undefined || args[value] == undefined) ? value : args[value];
		},
	});

	var CommandArgumentSpin = $.inherit(CommandArgument, {
		__constructor : function(minValue, maxValue, expression, arguments, argumentValues, problem) {
			this.__base();
			this.minValue = minValue;
			this.maxValue = maxValue;
			this.isCounter = false;
			this.expression = expression != undefined ? expression : minValue;
		},

		// initializeArgumentDomObject: function(command, index) {
		// 	this.__base(command, index);
		// 	if (this.domObject.length) {
		// 		this.expression = $(this.domObject).children('.spinExpression').val();
		// 		this.updateCallbacks();
		// 	}
		// },

		clone: function() {
			return new CommandArgumentSpin(this.minValue, this.maxValue, this.expression, this.arguments, this.argumentValues, this.problem);
		},

		generateDomObject: function(prev, callback, problem, value) {
			var spin = $('<spin class="testFunctionArgument"></spin>').insertAfter($(prev));
			this.domObject = spin;
			this.expression = value != undefined ? value : this.minValue;
			$(spin).append('<input class="spinExpression" value="' + this.expression + '" editable="false"></input>');
			$(spin).append('<input class="spinValue" value="' + this.expression + '" editable="false"></input>');
			$(spin).children('.spinValue').hide();
			$(spin).append('<img src="images/spin-button.png" style="position: relative; top: 4px">');
			this.problem = problem;
			this.updateCallbacks();
			return this.domObject;
		},

		// updateCallbacks: function() {
		// 	var self = this;
		// 	$(this.domObject).children('img').off('click').on('click', function(e){
		// 		var pos = e.pageY - $(this).offset().top;
		// 		var vector = ($(this).height()/2 > pos ? 1 : -1);

		// 		self.onSpinImgClick(vector);
		// 	});

		// 	$(this.domObject).children('.spinExpression').off('input').on('input', function() {
		// 		var newValue = $(this).val();
		// 		if (checkNumber(newValue)) {
		// 			self.onUpdateTotal(parseInt($(this).val()));
		// 		}
		// 		else {
		// 			self.onUpdateTotal($(this).val());
		// 		}
		// 	});
		// },

		searchArgument: function(arg) {
			if (!this.arguments) {
				return undefined;
			}
			for (var i = 0; i < this.arguments.length; ++i) {
				if (arg == this.arguments[i]) {
					return i;
				}
			}
			return undefined;
		},

		calculateNewExpression: function(delta) {
			var newExpression = undefined;
			if (checkNumber(this.expression)) {
				newExpression = parseInt(this.expression) + parseInt(delta);
			}
			else {
				var argIndex = this.searchArgument(this.expression);
				if (argIndex == undefined) { //we didn't find expression in arguments list, do nothing
					return undefined;
				}
				else {
					newExpression = -argIndex + parseInt(delta);
				}
			}
			return newExpression;
		},

		onSpinImgClick: function(delta) {
			var newExpression = this.calculateNewExpression(delta);
			if (newExpression == undefined) {
				return;
			}

			return this.onUpdateTotal(newExpression);
		},

		onUpdateTotal: function(newExpression) {
			if (newExpression < this.minValue) {
				newExpression = this.arguments.length ? this.arguments[Math.min(this.minValue - newExpression, this.arguments.length) - 1] : this.minValue;
			}
			else if (newExpression > this.maxValue) {
				newExpression = this.maxValue;
			}
			this.setExpression(newExpression);
			this.problem.updated();
			return false;
		},

		findValue: function(value) {
			if(!checkNumber(value) || value < this.minValue || value > this.maxValue)
				return undefined;
			return value;
		},

		addArguments: function(args, clear) {
			this.arguments = args.clone();
		},

		setExpression: function(newExpression) {
			this.expression = newExpression;
			if (this.field_)
				this.field_.setRawText(this.expression);
		},

		setValue: function(value, afterDomCreation) {
			this.setExpression(value);
		},

		getExpressionValueByArgs: function(args) {
			var value = this.expression;
			var result = (args == undefined || args[value] == undefined) ? value : args[value];
			if (checkNumber(result)) {
				return parseInt(result);
			}
			return result;
		},

		getValue: function(args) {
			return this.getExpressionValueByArgs(args);
		},

		// hideBtn: function(cnt) {
		// 	$(this.domObject).children('img').hide();
		// 	$(this.domObject).children('.spinExpression').hide();
		// 	$(this.domObject).children('.spinValue').show().val(this.getValue(this.argumentValues));
		// },

		// showBtn: function() {
		// 	$(this.domObject).children('img').show();
		// 	$(this.domObject).children('.spinExpression').show();
		// 	$(this.domObject).children('.spinValue').hide();
		// },

		setDefault: function(){
			// this.showBtn();
		},

		updateInterface: function(newState, blocklyField){
			this.__base(newState, blocklyField);
			switch (newState) {
				case 'START_EXECUTION':
					this.field_.setRawText(this.getValue(this.argumentValues).toString());
					break;
				case 'FINISH_EXECUTION':
					break;
			}
		},
	});

	var CommandArgumentSpinCounter = $.inherit(CommandArgumentSpin, {
			__constructor : function(minValue, maxValue, expression, arguments, argumentValues, problem)  {
			this.__base(minValue, maxValue, expression, arguments, argumentValues, problem);
			this.isCounter = true;
			this.value = undefined;
		},

		clone: function() {
			return new CommandArgumentSpinCounter(this.minValue, this.maxValue, this.expression, this.arguments, this.argumentValues, this.problem);
		},

		setDefault: function() {
			this.__base();
			this.value = undefined;
		},


		getValue: function(args) {
			var result = this.value;
			if (result == undefined) {
				result = this.__base(args);
			}
			if (!checkNumber(result)) {
				return undefined;
			}
			return parseInt(result);
		},

		updateInterface: function(newState, blocklyField){
			this.__base(newState, blocklyField);
			switch (newState) {
				case 'START_EXECUTION':
					if (this.value == undefined) {
						this.value = this.getValue(this.argumentValues);
					}
					if (this.value != undefined) {
						this.field_.setRawText(this.value + '/' + this.getExpressionValueByArgs(this.argumentValues));
					}
					else {
						this.field_.setRawText(this.getExpressionValueByArgs(this.argumentValues));
					}
					break;
				case 'FINISH_EXECUTION':
					break;
			}
		},

		getCounterValue: function(args) {
			if (this.value == undefined) {
				this.value = this.getValue(args);
			}
			return this.value;
		},

		decreaseValue: function() {
			if (this.value == undefined) {
				this.value = this.getValue(this.argumentValues);
			}

			if (!isInt(this.value) || this.value < 0) {
				throw new IncorrectInput('Некорректный счетчик');
			}

			--this.value;
			if (this.field_)
				// this.field_.setValue(this.value.toString());
				this.field_.setRawText(this.value + '/' + this.getExpressionValueByArgs(this.argumentValues));
		}
	});

	var CommandArgumentInput = $.inherit(CommandArgument, {
		__constructor : function() {
			this.__base();
			this.value = undefined;
		},

		clone: function() {
			return new CommandArgumentInput();
		},

		generateDomObject: function(prev, callback, problem, value) {
			var container = $('<span class="testFunctionArgument"></span>').insertAfter(prev);
			var input = $('<input class = "inputExpression"></input>').appendTo(container);
			var inputValue = $('<input class = "inputValue"></input>').appendTo(container);
			$(inputValue).hide();

			this.domObject = container;

			if (value) {
				this.setValue(value);
			}
			$(container).children('.inputExpression').change(function() {
				callback();
			});

			return this.domObject;
		},

		setValue: function(value, afterDomCreation) {
			this.value = value;
			if (this.field_)
				this.field_.setRawText(value);
		},

		returnValue: function(value) {
			if (checkNumber(value)) {
				return parseInt(value);
			}

			return value;
		},

		findValue: function() {
			if (checkNumber(this.value) || checkName(this.value)) {
				return this.value;
			}
			return '\"' + this.value + '\"';
		},

		getExpression: function() {
			return this.returnValue(this.value);
		},

		getValue: function(args) {
			var value = this.field_.getValue();
			if (args != undefined && args[value] != undefined) {
				return args[value];
			}
			return this.returnValue(value);
		},

		updateInterface: function(newState, blocklyField){
			this.__base(newState, blocklyField);
			switch (newState) {
				case 'START_EXECUTION':
					var value = this.getValue(this.argumentValues);
					this.field_.setRawText(value);
					break;
				case 'FINISH_EXECUTION':
					break;
			}
		},
	});

	var ExecutionUnitCommand = $.inherit({
		__constructor: function(name, handler, args) {
			this.name = name;
			this.handler = handler;
			this.arguments = args.clone();
			this.hasCounter = false;

			for (var i = 0; i < args.length; ++i) {
				if (args[i].isCounter) {
					this.hasCounter = true;
					break;
				}
			}
		},

		getArguments: function() {
			return this.arguments;
		}
	});

	return{
		CommandArgumentSelect: CommandArgumentSelect,
		CommandArgumentSpin: CommandArgumentSpin,
		CommandArgumentSpinCounter: CommandArgumentSpinCounter,
		CommandArgumentInput: CommandArgumentInput,
		ExecutionUnitCommand: ExecutionUnitCommand
	};
});
