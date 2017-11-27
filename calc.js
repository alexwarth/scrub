meh.declareModule('calc', function(customElement, graph, editor) {
 
  customElement.newType('calculatorText')
  customElement.newType('calculatorMeaningfulText')

  customElement.newType('calculatorLine').withPrototype({
    addText: function(text) {
      this.appendChild(customElement.create('calculatorText', text))
      return this
    },

    addMeaningfulText: function(text) {
      this.appendChild(customElement.create('calculatorMeaningfulText', text))
      this.isSimpleExpr = false
      return this
    },

    addNumber: function(value, numFracDigits, isMoney, name) {
      var line = this
      if (typeof value !== 'number')
        value = this.valueOfNumber(name) || 0
      var number = this.appendChild(customElement.create('number', value, numFracDigits, isMoney, name))
      this.numbers.push(number)

      // Make same-named numbers consistent
      this.updateAllNumbersNamed(name, value, numFracDigits, isMoney)
      number.addEventListener('cssclassnamechange', function(e) {
        line.doWithAllNumbersNamed(number.name, function(otherNumber) {
          otherNumber.className = number.className
        })
      }, false)
      number.addEventListener('valuechange', function(e) {
        line.addSample(e.detail.oldValue, line.value)
        line.updateAllNumbersNamed(number.name, number.getValue(), number.numFracDigits, number.isMoney)
        line.calculateValue()
        line.addSample(this.getValue(), line.value)
      }, false)

      // Graph mode
      number.addEventListener('scrubend', function(e) {
        line.stopGraphing()
      }, false)

      return this
    },

    valueOfNumber: function(name) {
      var value
      this.doWithAllNumbersNamed(name, function(number) {
        value = number.getValue()
      })
      return value
    },

    updateAllNumbersNamed: function(name, value, numFracDigits, isMoney) {
      this.doWithAllNumbersNamed(name, function(otherNumber) {
        otherNumber.numFracDigits = numFracDigits
        otherNumber.setValue(value, isMoney)
      })
    },

    doWithAllNumbersNamed: function(name, f) {
      if (name === undefined)
        return
      for (var idx = 0; idx < this.childNodes.length; idx++) {
        var node = this.childNodes.item(idx)
        if (node.tagName == 'NUMBER' && node.name == name)
          f(node)
      }
    },

    setFormula: function(f) {
      this.formula = f
      this.calculateValue()
    },

    setValue: function(newValue) {
      var oldValue = this.value
      if (newValue == oldValue)
        return
      this.value = newValue
      var showValue = newValue !== undefined && !this.isSimpleExpr
      var sign = newValue < 0 ? '-' : ''
      var magnitude = Math.abs(newValue)
      if (this.isMoney())
        magnitude = '$' + magnitude.toFixed(2);
      this.setAttribute('value', showValue ? ' = ' + sign + magnitude : '')
      this.dispatchEvent(new CustomEvent('valuechange', {
        detail: {
          oldValue: oldValue,
          newValue: this.value
        }
      }))
    },

    calculateValue: function() {
      var newValue
      if (this.formula) {
        var numberValues = this.numbers.map(function(number) { return number.getValue() })
        newValue = this.formula.apply(undefined, numberValues)
      }
      this.setValue(newValue)
      return newValue
    },

    isMoney: function() {
      for (var idx = 0; idx < this.childNodes.length; idx++) {
        var node = this.childNodes.item(idx)
        if (node.tagName == 'NUMBER' && node.isMoney)
          return true
      }
      return false
    },

    startGraphing: function() {
      if (this.graphMode)
        return
      this.graphMode = true
      this.scrubRange = {}
    },

    addSample: function(x, y) {
      if (!this.graphMode)
        return
      var r = this.scrubRange
      r.currX = x
      r.xMin = r.xMin === undefined ? x : Math.min(r.xMin, x)
      r.xMax = r.xMax === undefined ? x : Math.max(r.xMax, x)
      if (isFinite(y)) {
        r.yMin = r.yMin === undefined ? y : Math.min(r.yMin, y)
        r.yMax = r.yMax === undefined ? y : Math.max(r.yMax, y)
        r[x] = y
      }
      graph.show(r, this.parentNode)
    },

    stopGraphing: function() {
      if (!this.graphMode)
        return
      this.graphMode = false
      delete this.scrubRange
      graph.hide()
    }
  }).withInitializer(function() {

    var self = this

    var SHIFT_KEY = 16
    window.addEventListener('keydown', function(e) {
      if (e.keyCode == SHIFT_KEY)
        self.startGraphing()
    }, false)
    window.addEventListener('keyup', function(e) {
      if (e.keyCode == SHIFT_KEY)
        self.stopGraphing()
    }, false)

    this.numbers = []
    this.isSimpleExpr = true
  })

  customElement.newType('calculator').withPrototype({
    clear: function() {
      this.editor.clear()
    },
    addLine: function() {
      var line = customElement.create('calculatorLine')
      this.editor.appendChild(line)
      return line
    },
    getText: function() {
      return this.editor.getText()
    },
    setCursorPos: function(pos) {
      this.editor.setCursorPos(pos)
    },
    getCursorPos: function() {
      return this.editor.getCursorPos()
    }
  }).withInitializer(function() {
    this.editor = this.appendChild(editor.create())
  })

  // Public methods

  this.create = function() {
    return customElement.create('calculator')
  }
})

