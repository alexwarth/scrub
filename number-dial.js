/*

This widget is like Bret's scrubbable number, but it works like a dial instead of a slider.
Here's how it's used:

  -- The user moves the mouse over a number while pressing the CTRL key -- this is exactly like
     a drag gesture, but w/ the CTRL key instead of the mouse button. (I went with a modifier
     key instead of mouse down b/c it's pretty tricky to make little circles with a trackpad
     while holding the mouse down.) Imagine a line going from the center of the number node to
     the mouse pointer.

  -- When the user moves the mouse pointer, while still pressing the CTRL key, the angle the new
     line makes with the old line is used as the delta value. (Actually, it's that value times
     100 / 360 to make it 100 units per turn.)

What's nice about this?

  -- Unlike Bret's slider-like UI, there's no limit to how far you can take a number that's near
     the left or right edge of the display.

  -- You can go really fast by making tight circles around the center of the point, and you can
     get more precision by increasing the radius. (Note that this scheme is still compatible with my
     "float mode" -- pressing the ALT key just divides the delta by 100.)

  -- The display's resolution doesn't affect the scrubbing behavior. This is not the case with the
     slider-like UI, where moving the mouse pointer by an inch could mean a different amount of
     change for different users.

*/

meh.declareModule('number', function(drag, customElement) {

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
      set(this, 'sign', newValue < 0 ? '-' : '')
      this.isMoney = isMoney
      set(this, 'currency', isMoney ? '$' : '')
      var magnitude = Math.abs(newValue).toFixed(this.numFracDigits)
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
      this.dispatchEvent(new CustomEvent('scrubstart'))
    },

    drag: function(e) {
      this.setCssClassName('standout')
      var deltaMultiplier = Math.pow(10, -this.numFracDigits)
      var centerX = this.offsetLeft + this.offsetWidth / 2
      var centerY = this.offsetTop + this.offsetHeight / 2
      var angle = Math.round(Math.atan2(e.detail.y - centerY, e.detail.x - centerX) * 180 / Math.PI)
      if (this.lastAngle === undefined)
        this.lastAngle = angle
      var delta = angle - this.lastAngle
      if (Math.abs(delta + 360) < Math.abs(delta))
        delta += 360
      else if (Math.abs(delta - 360) < Math.abs(delta))
        delta -= 360
      delta = Math.round(delta * 100 / 360)

      this.lastAngle = angle
      var newValue = this.getValue() + delta * deltaMultiplier
      this.setValue(newValue, this.isMoney, true)

      placeCursorJustAfter(this.lastChild)
    },

    dragEnd: function(e) {
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

