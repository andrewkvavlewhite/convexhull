
import { ConvexHullManager } from './convexhull.js'

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
  // ...testcase13
  // ...testcase14
  // ...testcase15
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

const distance = ( p1, p2 ) => {
  return Math.sqrt(Math.abs((p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y)))
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

  let { r: radius, ...center } = newCircle

  let newHull = hulls.circleToHull({ radius, center })
  let test = JSON.parse(JSON.stringify(hulls.getHulls()))
  test.push( newHull )
  console.log(JSON.stringify(test))

  let tangentPoints = hulls.addHull( newHull )
  
  drawHulls()
  for( let point of tangentPoints ) {
    ctx.beginPath()
    ctx.arc( point.x, point.y , 5, 0, 2 * Math.PI )
    ctx.stroke()
  }
  newCircle = null
})


drawHulls()

if( hulls.hulls[ 0 ] && hulls.hulls[ 1 ]) {
  // let i = 8
  // ctx.beginPath()
  // ctx.arc( hulls.hulls[ 1 ][ i ].x, hulls.hulls[ 1 ][ i ].y , 5, 0, 2 * Math.PI )
  // ctx.stroke()
  let tangentPoints = hulls.mergeHulls( hulls.hulls[0], hulls.hulls[1])
  for( let point of tangentPoints ) {
    ctx.beginPath()
    ctx.arc( point.x, point.y , 5, 0, 2 * Math.PI )
    ctx.stroke()
  }
}

// drawHulls()