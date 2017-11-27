meh.declareModule('graph', function() {

  var canvas
  function ensureAndShowCanvas() {
    if (!canvas) {
      canvas = document.body.appendChild(document.createElement('canvas'))
      canvas.style.position = 'absolute'
      canvas.style.top = '0'
      canvas.style.left = '0'
    }
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    return canvas
  }

  var xMin, xMax, xRange, yMin, yMax, yRange
  function translateX(x) { return (x - xMin) * window.innerWidth / xRange }
  function translateY(y) { return window.innerHeight - (y - yMin) * window.innerHeight / yRange }

  var padding = 0.1

  function setLineDash(ctxt, lineDash) {
    if (ctxt.setLineDash)
      ctxt.setLineDash(lineDash)
    else
      ctxt.mozDash = lineDash
  }

  function drawAxes(ctxt) {
    ctxt.strokeStyle = '#d8d8d8'
    setLineDash(ctxt, [5, 5])
    ctxt.beginPath()
    ctxt.moveTo(translateX(xMin), translateY(0))
    ctxt.lineTo(translateX(xMax), translateY(0))
    ctxt.moveTo(translateX(0), translateY(yMin))
    ctxt.lineTo(translateX(0), translateY(yMax))
    ctxt.closePath()
    ctxt.stroke()
    setLineDash(ctxt, [])
  }

  function getSortedXs(scrubRange) {
    var xs = Object.keys(scrubRange)
    xs = xs.map(function(key) { return parseFloat(key) })
    xs = xs.filter(function(x) { return !isNaN(x) })
    xs.sort(function(x, y) { return x - y })
    return xs
  }

  function drawCurve(ctxt, xs, scrubRange) {
    ctxt.strokeStyle = '#aaf'
    ctxt.beginPath()
    ctxt.moveTo(translateX(xs[0]), translateY(scrubRange[xs[0]]))
    xs.forEach(function(x) {
      var y = scrubRange[x]
      var tx = translateX(x)
      var ty = translateY(y)
      ctxt.lineTo(tx, ty)
      ctxt.moveTo(tx, ty)
    })
    ctxt.closePath()
    ctxt.stroke()
  }

  function drawPointsOfInterest(ctxt, xs, scrubRange) {
    var points = []
    function addPoint(x, y, color) {
      if (!isFinite(y))
        return
      for (var idx = 0; idx < points.length; idx++)
        if (points[idx].x == x && points[idx].y == y)
          return
      points.push({x: x, y: y, color: color})
    }

    var xForYMin = xs.filter(function(x) { return scrubRange[x] == scrubRange.yMin })[0]
    var xForYMax = xs.filter(function(x) { return scrubRange[x] == scrubRange.yMax })[0]

    addPoint(xForYMin, scrubRange.yMin, 'lightblue')
    addPoint(xForYMax, scrubRange.yMax, 'lightblue')
    addPoint(scrubRange.xMin, scrubRange[scrubRange.xMin], 'lightblue')
    addPoint(scrubRange.xMax, scrubRange[scrubRange.xMax], 'lightblue')
    addPoint(scrubRange.currX, scrubRange[scrubRange.currX], 'slateblue')

    points.forEach(function(point) {
      drawPoint(ctxt, point.x, point.y, point.color)
    })
  }

  function drawPoint(ctxt, x, y, color) {
    // Fill
    var screenX = translateX(x)
    var screenY = translateY(y)
    ctxt.beginPath()
    ctxt.arc(screenX, screenY, 2, 0, 2 * Math.PI, false)
    ctxt.fillStyle = color
    ctxt.closePath()
    ctxt.fill()

    // Outline
    ctxt.lineWidth = 1
    ctxt.strokeStyle = '#b8b8b8'
    ctxt.stroke()

    // Label
    ctxt.font = '12px Arial'
    ctxt.fillStyle = color
    var text = ['(', formatCoordinate(x), ', ', formatCoordinate(y), ')'].join('')
    var textWidth = ctxt.measureText(text).width
    ctxt.fillText(text, screenX - textWidth / 2, screenY + 15)
  }

  function formatCoordinate(c) {
    var maxDigits = 5
    var cString = '' + c
    return cString.length > maxDigits ? c.toPrecision(maxDigits) : cString
  }

  // Public methods

  this.hide = function() {
    if (canvas) {
      document.body.removeChild(canvas)
      canvas = undefined
    }
  }

  this.show = function(scrubRange, line) {
    xMin = scrubRange.xMin - padding * (scrubRange.xMax - scrubRange.xMin)
    xMax = scrubRange.xMax + padding * (scrubRange.xMax - scrubRange.xMin)
    xRange = xMax - xMin

    yMin = scrubRange.yMin
    yMax = scrubRange.yMax
    if (isFinite(yMin) && yMin == yMax) {
      yMin = -Math.abs(yMin)
      yMax = +Math.abs(yMax)
    }

    yMin -= padding * (yMax - yMin)
    yMax += padding * (yMax - yMin)
    yRange = yMax - yMin

    var ctxt = ensureAndShowCanvas(line).getContext('2d')
    ctxt.clearRect(0, 0, window.innerWidth, window.innerHeight)
    drawAxes(ctxt)

    var xs = getSortedXs(scrubRange)
    if (xs.length < 2)
      return

    drawCurve(ctxt, xs, scrubRange)
    drawPointsOfInterest(ctxt, xs, scrubRange)
  }
})

