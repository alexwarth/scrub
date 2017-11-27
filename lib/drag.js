meh.declareModule('drag', function() {

  // Some private state

  var self = this
  var mouseX, mouseY, mouseOverElement
  var target, lastX, lastY

  // Helper methods

  function findEligibleTarget(node) {
    while (node && !node.generatesDragEvents)
      node = node.parentNode
    return node
  }

  function dispatchEvent(type, e) {
    target.dispatchEvent(new CustomEvent(type, {
      detail: {
        x: mouseX,
        y: mouseY,
        lastX: lastX !== undefined ? lastX : mouseX,
        lastY: lastY !== undefined ? lastY : mouseY,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey
      }
    }))
  }

  // Handling mouse events

  window.addEventListener('mousemove', function(e) {
    mouseOverElement = e.target
    mouseX = e.clientX
    mouseY = e.clientY
    if (target)
      drag(e)
  }, false)

  // Handling keyboard events

  var ALT_KEY = 18

  window.addEventListener('keydown', function(e) {
    if (!self.inProgress && e.keyCode == ALT_KEY)
      target = findEligibleTarget(mouseOverElement)
  }, false)

  window.addEventListener('keyup', function(e) {
    if (self.inProgress && e.keyCode == ALT_KEY)
      endDrag(e)
  }, false)

  // Generating drag events

  function startDrag(e) {
    self.inProgress = true
    dispatchEvent('dragstart', e)
  }

  function drag(e) {
    if (!self.inProgress)
      startDrag(e)
    dispatchEvent('drag', e)
    lastX = mouseX
    lastY = mouseY
  }

  function endDrag(e) {
    self.inProgress = false
    dispatchEvent('dragend', e)
    target = undefined
    lastX = undefined
    lastY = undefined
  }

  // Public fields and methods

  self.inProgress = false
  self.shouldGenerateEvents = function(node) {
    node.generatesDragEvents = true
  }
})

