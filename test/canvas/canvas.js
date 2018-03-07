
const canvas = $( '#canvas' ).get(0)
const ctx = canvas.getContext( '2d' )
const offset = $( '#canvas' ).parent().offset()

const hulls = new ConvexHullManager([
  // ...smaller_to_the_top
  // ...small_upper_left
  // ...bottom_bigger
  // ...small_left
  // ...big_left
  // ...big_left_alt
  // ...tiny_left_pertruding
  // ...pertruding_diagonal
  // ...testcase1
  // ...testcase2
  // ...testcase3
  // ...testcase4
  // ...testcase5
  // ...testcase6
  // ...testcase7
  // ...testcase8
  // ...testcase9
  // ...testcase10
  // ...testcase11
  // ...testcase12
  // ...testcase14
  // ...testcase13
])
let newCircle = null

const drawHulls = () => {
  ctx.beginPath()
  ctx.clearRect( 0, 0, canvas.width, canvas.height )
  ctx.closePath()
  for( let hull of hulls.getHulls() ) {
    for( let i = 0; i < hull.length; i++ ) {
      ctx.moveTo( hulls.getPoint( hull, i ).x, hulls.getPoint( hull, i ).y )
      ctx.lineTo( hulls.getPoint( hull, i+1 ).x, hulls.getPoint( hull, i + 1 ).y )
      ctx.stroke()
    }
  }
}

const getCoordinates = e => {
  let x = e.pageX - offset.left
  let y = e.pageY - offset.top
  return { x, y }
}

let isDragging = false
$( '#canvas' ).mousedown( e => {
  isDragging = true
  newCircle = { 
    ...getCoordinates( e ),
    r: 0
  }
})
.mousemove( e => {
  if( isDragging ) {
    drawHulls()
    newCircle.r = distance( newCircle, getCoordinates( e ))
    ctx.beginPath()
    let { x, y, r } = newCircle
    ctx.arc( x, y, r, 0, 2 * Math.PI )
    ctx.closePath()
    ctx.stroke()
  }
})
.mouseup( e => {
  isDragging = false
})

$( '#addBtn' ).click( e => {
  if( !newCircle ) return

  let { r: circleRadius, ...circleCenter } = newCircle

  let hull = [ circleCenter ]
  let newHull = []

  let i = 0
  let q = 0
  while( i < hull.length && q < 4 ) {

    if( inCircle( newCircle, hull[ i ])) {
      console.log('shiz')
    }

    let isDifferentQuadrant = quadrantDirection( getQuadrant( q ) ) != direction( hull[ i ], getPoint( hull, i + 1 ))
    if( inCircle( newCircle, getPoint( hull, i + 1 )) && isDifferentQuadrant ) {
      newHull.push({
        x: circleCenter.x + circleRadius * getQuadrant( q ).x,
        y: circleCenter.y + circleRadius * getQuadrant( q ).y
      })
      q++
    } else {
      i++
    }
  }

  q = 0
  for( i = 0; i < newHull.length; i++ ) {
    let point = getPoint( newHull, i )
    let prevPoint = getPoint( newHull, i - 1 )
    let nextPoint = getPoint( newHull, i + 1 )
    let deg = getAngle( point, prevPoint, nextPoint )
    if( isAcuteAngle( deg )) {
      // let q = getQuadrant( point, prevPoint, nextPoint )
      let adj = distance( circleCenter, point ) - circleRadius
      let hyp = adj / Math.cos( Math.radians(deg/2) )
      let newPoints = []
      let correction1 = {
        x: getPoint( newHull, i ).x - ( hyp * getQuadrant( q ).x ),
        y: getPoint( newHull, i ).y
      }
      let correction2 = {
        x: getPoint( newHull, i ).x,
        y: getPoint( newHull, i ).y - ( hyp * getQuadrant( q ).y )
      }
      if( q % 2 == 1) {
        newPoints.push(correction1)
        newPoints.push(correction2)
      } else {
        newPoints.push(correction2)
        newPoints.push(correction1)
      }

      newHull.splice( i, 1, ...newPoints)
      i++
    }
    if( isNextQuadrant( q, point, nextPoint )) {
      q++
    }
  }
  let test = JSON.parse(JSON.stringify(hulls.getHulls()))
  test.push( newHull )
  console.log(JSON.stringify(test))

  let tangentPoints = hulls.addHull( newHull )
  
  drawHulls()

  // let edgePoints = []
  // for( let deg = 0; deg <= 360; deg += 45 ) {
  //   edgePoints.push({
  //     x: newCircle.x + circleRadius * Math.cos( Math.radians( deg )),
  //     y: newCircle.y + circleRadius * Math.sin( Math.radians( deg ))
  //   })
  // }
  for( let point of tangentPoints ) {
    ctx.beginPath()
    ctx.arc( point.x, point.y , 5, 0, 2 * Math.PI )
    ctx.stroke()
  }
  newCircle = null
})


drawHulls()

if( hulls.hulls[ 0 ] && hulls.hulls[ 1 ]) {
  let tangentPoints = hulls.mergeHulls( hulls.hulls[0], hulls.hulls[1])
  for( let point of tangentPoints ) {
    ctx.beginPath()
    ctx.arc( point.x, point.y , 5, 0, 2 * Math.PI )
    ctx.stroke()
  }
}

// mergeHulls3( hulls.getHulls())
drawHulls()