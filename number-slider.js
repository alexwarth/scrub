meh.declareModule('number', function(drag, customElement) {

  var scrubbing
  var mouseButtonDown
  window.addEventListener('mousedown', function(e) {
    mouseButtonDown = true
    if (scrubbing)
      e.preventDefault()
  }, false)
  window.addEventListener('mouseup', function(e) {
    mouseButtonDown = false
  }, false)

  function placeCursorJustAfter(node) {
    // TODO: find out why just doing the following doesn't work
    //document.getSelection().collapse(node, 1)

    var range = document.createRange()
    range.setStartAfter(node)
    range.setEndAfter(node)
    var selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  customElement.newType('numberSign')
  customElement.newType('numberCurrency')
  customElement.newType('numberMagnitude')
  customElement.newType('numberName')

  function set(number, fieldName, value) {
    var text = number[fieldName].firstChild
    if (text)
      text.data = value
    else {
      var text = document.createTextNode(value)
      number[fieldName].appendChild(text)
    }
  }

  function get(number, fieldName) {
    var text = number[fieldName].firstChild
    return text ? text.data : ''
  }

  customElement.newType('number').withPrototype({
    getValue: function() {
      var magnitude = parseFloat(get(this, 'magnitude'))
      return (get(this, 'sign') == '-') ? -magnitude : magnitude
    },

    setValue: function(newValue, isMoney, fireEvents) {
      var oldValue = this.getValue()
      this.isMoney = isMoney
      set(this, 'sign', newValue < 0 ? '-' : '')
      set(this, 'currency', isMoney ? '$' : '')
      var magnitude = Math.abs(newValue)
      magnitude = magnitude.toFixed(this.numFracDigits)
      set(this, 'magnitude', magnitude)
      if (newValue != oldValue && fireEvents) {
        this.dispatchEvent(new CustomEvent('valuechange', {
          detail: {
            oldValue: oldValue,
            newValue: newValue,
          }
        }))
      }
    },

    dragStart: function(e) {
      scrubbing = true
      this.dispatchEvent(new CustomEvent('scrubstart'))
    },

    drag: function(e) {
      this.setCssClassName('standout')
      var deltaMultiplier = (mouseButtonDown ? -1 : 1) * Math.pow(10, -this.numFracDigits)
      var delta = e.detail.x - e.detail.lastX
      var newValue = this.getValue() + delta * deltaMultiplier
      this.setValue(newValue, this.isMoney, true)
      placeCursorJustAfter(this.lastChild)
    },

    dragEnd: function(e) {
      scrubbing = false
      this.lastAngle = undefined
      this.setCssClassName('')
      this.dispatchEvent(new CustomEvent('scrubend'))
    },

    setCssClassName: function(className) {
      if (this.className == className)
        return
      this.className = className
      this.dispatchEvent(new CustomEvent('cssclassnamechange'))
    }
  }).withInitializer(function(value, numFracDigits, isMoney, name) {
    this.numFracDigits = numFracDigits
    this.name = name
    this.sign = this.appendChild(customElement.create('numberSign', ''))
    this.currency = this.appendChild(customElement.create('numberCurrency', ''))
    this.magnitude = this.appendChild(customElement.create('numberMagnitude', ''))
    this.appendChild(customElement.create('numberName', name))

    this.setValue(value, isMoney)

    // Make the number and its "siblings" stand out when the user mouses over them
    this.addEventListener('mouseover', function(e) {
      if (!drag.inProgress)
        this.setCssClassName('standout')
    }, false)
    this.addEventListener('mouseout', function(e) {
      this.setCssClassName('')
    }, false)

    // Add scrubbing behavior
    drag.shouldGenerateEvents(this)
    this.addEventListener('dragstart', function(e) { this.dragStart(e) }, false)
    this.addEventListener('drag', function(e) { this.drag(e) }, false)
    this.addEventListener('dragend', function(e) { this.dragEnd(e) }, false)
  })
})

