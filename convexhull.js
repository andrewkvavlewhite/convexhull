// var SAT = require(['sat'])
import 'sat'

class ConvexHullManager {

  constructor( existinghulls ) {
    this.hulls = existinghulls
    this.q = null
    this.quadrants = [ -1, 1, 1, -1 ]
  }

  getHulls() {
    return this.hulls
  }

  circleToHull ({ center, radius }) {

  }

  mergeHulls( h1, h2 ) {
    this.hulls = [ h1 ]
    return this.addHull( h2 )
  }

  addHull( hull ) {
    let tangentPoints = []
    for( let i = 0; i < this.hulls.length; i++ ) {

      if( this.isOverlapping( this.hulls[ i ], hull )) {
        continue
      }

      this.q = 0

      let hulls = [ this.hulls[ i ], hull ]
      let maximas = this.getMaximas( ...hulls )

      let idx = [ 0, 0 ]
      let h = maximas[ 1 ][ 0 ].value < maximas[ 0 ][ 0 ].value

      // TODO: make following for-loop part of a separate function
      let tangents = []
      for( let bound = 0; this.q < 4; bound++, h = !h ) {

        console.log( 'FINDING ' + ( bound % 2 ? 'UPPER' : 'LOWER') + ' TANGENT...' )
        let t = this.getNextTanget( hulls[ h|0 ], hulls[ !h|0 ], idx[ h|0 ], idx[ !h|0 ], maximas[ h|0 ], maximas[ !h|0 ])
        console.log(( bound % 2 ? 'UPPER' : 'LOWER' ) + ' TANGENT FOUND!')

        idx [ h|0 ] = t[ 0 ]
        idx [ !h|0 ] = t[ 1 ]

        if( idx[ h|0 ] >= hulls[ h|0 ].length - 1 && idx[ !h|0 ] >= hulls[ !h|0 ].length - 1 && bound % 2 == 0 ) {
          break
        }

        tangents.push( t )
        tangentPoints.push( hulls[ h|0 ][ idx [ h|0 ]])
        tangentPoints.push( hulls[ !h|0 ][ idx [ !h|0 ]])

        // if polygon ends on a lower bound, most likely the other polygon is fully contained
        // so to avoid errors, break immediately
        if( idx[ h|0 ] == hulls[ h|0 ].length - 1 && bound % 2 == 0 ) {
          break
        }
      }

      let newHull = []
      for( let t = 0, idx = [ 0, 0 ]; idx[ h|0 ] < hulls[ h|0 ].length; ) {
        newHull.push( hulls[ h|0 ][ idx[ h|0 ]])
        if( t < tangents.length && idx[ h|0 ] == tangents[ t ][ 0 ] ) {
          idx[ !h|0 ] = tangents[ t ][ 1 ]
          h = !h
          t++
        } else {
          idx[ h|0 ]++
        }
      }
      this.hulls.splice( i, 1 )
      hull = newHull
    }
    this.q = null
    this.hulls.push( hull )
    return tangentPoints
  }

  getNextTanget( h1, h2, i1, i2, m1, m2 ) {
    let p1 = this.getPoint( h1, i1)
    let p1_next = this.getPoint( h1, i1 + 1 )
    let p2 = this.getPoint( h2, i2)
    let p2_next = this.getPoint( h2, i2 + 1 )
    let axis = m1[ this.q % 4 ].axis
    let next_axis = m1[( this.q + 1 ) % 4 ].axis
    let quadrant = this.quadrants[ this.q % 4 ]
    let next_quadrant = this.quadrants[( this.q + 1 ) % 4 ]
    let maxima1 = m1[ this.q%4 ].value
    let maxima2 = m2[ this.q%4 ].value
    let next_maxima1 = m1[ (this.q+1)%4 ].value
    let next_maxima2 = m2[ (this.q+1)%4 ].value

    if(( i1 > 0 || i2 > 0 ) && this.isOutsideMaxima( next_maxima1, next_maxima2, next_quadrant )) {
      while( next_quadrant[ next_axis ] * ( p2[ next_axis ] - next_maxima2 ) < 0 ) {
        i2++
        p2 = this.getPoint( h2, i2 )
      }
      while( next_quadrant[ next_axis ] * ( p1[ next_axis ] - next_maxima1 ) < 0 ) {
        i1++
        p1 = this.getPoint( h1, i1 )
      }
      this.q++
    }

    while( i1 < h1.length - 1 || i2 < h2.length - 1 ) {
      p1 = this.getPoint( h1, i1 )
      p1_next = this.getPoint( h1, i1 + 1 )
      p2 = this.getPoint( h2, i2 )
      p2_next = this.getPoint( h2, i2 + 1 )
      axis = m1[ this.q % 4 ].axis
      next_axis = m1[( this.q + 1 ) % 4 ].axis
      quadrant = this.quadrants[ this.q % 4 ]
      next_quadrant = this.quadrants[( this.q + 1 ) % 4 ]
      maxima1 = m1[ this.q % 4 ].value
      maxima2 = m2[ this.q % 4 ].value
      next_maxima1 = m1[( this.q + 1 ) % 4 ].value
      next_maxima2 = m2[( this.q + 1 ) % 4 ].value

      console.log('POSITION:', i1, i2, next_axis )

      if( p2[ next_axis ] == next_maxima2 ) {
        console.log('CATCHING UP TO OTHER HULL...')

        if( quadrant * ( p1_next[ axis ] - p2[ axis ]) < 0 && this.isOutsideMaxima( next_maxima2, p1_next[ next_axis ], next_quadrant )) {
          break
        }

        let projection = this.getPointProjection( p1, p1_next, p2 )

        if( quadrant * ( p1_next[ axis ] - p2[ axis ] ) < 0 &&
          this.isOutsideMaxima( p2[ next_axis ], projection[ next_axis ], next_quadrant )
        ) {
          break
        }

        let slope = this.getSlope( p2, p1 )
        let nextSlope = this.getSlope( p2, p1_next )

        if(( slope - nextSlope ) < 0 && this.isOutsideMaxima( next_maxima2, p1_next[ next_axis ], next_quadrant )) {
          break
        }

        if( p1[ next_axis ] != next_maxima1 ) {
          i1++
        } else {
          this.q++
        }
      } else if( next_quadrant * ( p2[ next_axis ] - p1[ next_axis ]) < 0 ) {
        console.log('OTHER HULL POSITION IS LAGGING')
        i2++
        
      } else if( this.isOutsideMaxima( p1[ axis ], p2[ axis ])) {
        console.log('PRIMARY HULL IS OUTSIDE OF OTHER HULL')

        let slope = this.getSlope( p1, p2 )
        let nextSlope = this.getSlope( p1, p2_next )
        let projection = this.getPointProjection( p1, p1_next, p2 )
        console.log('forwards slopes:', slope, nextSlope )
        
        if( ( slope - nextSlope ) < 0 ) {
          i2++
        } else {
          let next_is_outside_point = this.isOutsideMaxima( projection[ axis ], p2[ axis ])
          // let next_is_outside_next_maxima = this.isOutsideMaxima( p1_next[ next_axis ], maxima2, next_quadrant )
          if( next_is_outside_point ) {
            console.log('shizzzzy')
            if( next_quadrant * ( p2[ next_axis ] - p1_next[ next_axis ]) < 0 ) {
              i1++
              continue
            }
            slope = this.getSlope( p1, p2 )
            nextSlope = this.getSlope( p1_next, p2 )
            if( nextSlope < slope ) {
              i1++
              continue
            }
          }
          break
        }
      } else if( !this.isOutsideMaxima( p1[ axis ], p2[ axis ])) {
        console.log('PRIMARY HULL NOT OUTSIDE OF OTHER HULL')
        let slope = this.getSlope( p2, p1 )
        let nextSlope = this.getSlope( p2, p1_next )
        console.log('backwards slopes:', nextSlope, slope )
        if( nextSlope < slope ) {
          i1++
        } else {
          break
        }
      } else {
        console.log('FARTERRRR!')
      }
    }
    console.log('POSITION:', i1, i2, next_axis )
    return [ i1, i2 ]
  }

  isOverlapping( h1, h2 ) {
    return false
  }

  getPoint( arr, i ) {
    if( i >= 0 ) {
      return arr[ i % arr.length ]
    } else {
      let abs = Math.abs( i )
      if( abs % arr.length == 0 ) {
        return arr[ 0 ]
      } else {
        let mod = -(abs % arr.length)
        return arr[ arr.length + mod ]
      }
    }
  }

  getSlope( p1, p2 ) {
    return ( p2.y - p1.y ) / ( p2.x - p1.x )
  }

  isOutsideMaxima( coordinate, maxima, qm = this.quadrants[ this.q ] ) {
    return qm * ( maxima - coordinate ) < 0
  }

  getQuadrant( q ) {
    return quadrants[ Math.min( q, 3 )]
  }

  getMaximas( h1, h2 ) {
    let m = []
    for( let i in arguments ) {
      m.push([{ axis: 'x' }, { axis: 'y' }, { axis: 'x' }, { axis: 'y' }])
      for( let q = 0, j = 0; q < 4; j++ ) {
        let p = this.getPoint( arguments[ i ], j )
        let _p = this.getPoint( arguments[ i ], j + 1 )
        let a = m[ i ][ q ].axis
  
        if( this.getQuadrant( q )[ a ] * ( _p[ a ] - p[ a ]) < 0) {
          m[ i ][ q ].value = p[ a ]
          q++
        }
      }
    }
    return m
  }
  getPointProjection( p2, p2_next, p1) {
    let d_x = ( p2_next.x - p2.x )
    if( d_x == 0 ) {
      return {
        x: p2.x,
        y: p1.y
      }
    }
    let d_y = ( p2_next.y - p2.y )
    let m = d_y / d_x
    let b = p2.y - ( m * p2.x )
    let projected_y = ( m * p1.x ) + b
    let projected_x = ( p1.y - b ) / m
    return { x: projected_x, y: projected_y }
  }


}




const quadrants = [
  { x: -1, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 }
]

Math.radians = function(degrees) {
	return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
};

// checks whether the point crosses the convex hull
// or not
const orientation = ( a, b, c ) =>
{
    let res = (b.second-a.second)*(c.first-b.first) -
              (c.second-b.second)*(b.first-a.first);
 
    if (res == 0)
        return 0;
    if (res > 0)
        return 1;
    return -1;
}
 
// Returns the square of distance between two input points
const distance = ( p1, p2 ) =>
{
    return Math.sqrt(Math.abs((p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y)))
}

// const sqDist = ( p1, p2 ) =>
// {
//     return (p1.first-p2.first)*(p1.first-p2.first) +
//            (p1.second-p2.second)*(p1.second-p2.second);
// }

const direction = ( p1, p2 ) => {
	if( p1.x == p2.x ) {
		return Infinity
	}
	if( p1.y > p2.y) {
		return -1
	} else if( p1.y < p2.y ) {
		return 1
	} else {
		return 0
	}
}

const quadrantDirection = ( q ) => {
	return -( q.x * q.y )
}

const getQuadrant = ( q ) => {
	return quadrants[ Math.min( q, 3 )]
}

const isNextQuadrant = ( q, p1, p2 ) => {
    let x_slope = p2.x - p1.x
    let y_slope = -( p2.y - p1.y )
    return ( getQuadrant( q ).x * x_slope * getQuadrant( q ).y * y_slope ) <= 0 
}

// const nextPoint = ( points, i ) => {
// 	if( i == points.length - 1) {
// 		return points[ 0 ]
// 	}
// 	// console.log('fuck',points)
// 	// console.log('dhit', points[ i + 1 ])
// 	return points[ i + 1 ]
// }

// const lastPoint = ( points, i ) => {
// 	if( i == 0) {
// 		return points[ points.length - 1 ]
// 	}
// 	return points[ i - 1 ]
// }

const getPoint = ( arr, i ) => {
  if( i >= 0 ) {
    return arr[ i % arr.length ]
  } else {
    let abs = Math.abs( i )
    if( abs % arr.length == 0 ) {
      return arr[ 0 ]
    } else {
      let mod = -(abs % arr.length)
      return arr[ arr.length + mod ]
    }
  }
}

const inCircle = ( circle, point ) => {
	let { r: circleRadius, ...circleCenter } = circle
	return distance( point, circleCenter ) < circleRadius
}

const getAngle = ( v, p1, p2 ) => {
	let v_p1 = distance( v, p1 )
	let v_p2 = distance( v, p2 )
	let p1_p2 = distance( p1, p2 )
	return Math.round(Math.degrees( Math.acos(( Math.pow( v_p1, 2 ) + Math.pow( v_p2, 2 ) - Math.pow( p1_p2, 2 )) / (2 * v_p1 * v_p2))))
}

const isAcuteAngle = deg => {
	return Math.round( deg ) <= 90
}

const getSlope = ( p1, p2 ) => {
	return ( p2.y - p1.y ) / ( p2.x - p1.x )
}

const getInverseSlope = ( p1, p2 ) => {
	return ( p2.x - p1.x ) / ( p2.y - p1.y )
}

const getPointProjection = ( p2, p2_next, p1) => {
  let d_x = ( p2_next.x - p2.x )
  if( d_x == 0 ) {
    return {
      x: p2.x,
      y: p1.y
    }
  }
  let d_y = ( p2_next.y - p2.y )
  let m = d_y / d_x
  let b = p2.y - ( m * p2.x )
  let projected_y = ( m * p1.x ) + b
  let projected_x = ( p1.y - b ) / m
  return { x: projected_x, y: projected_y }
}

const line_intersect = (x1, y1, x2, y2, x3, y3, x4, y4) =>
{
    var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1)
    if (denom == 0) {
        return null
    }
    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom
    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom
    return {
        x: x1 + ua*(x2 - x1),
        y: y1 + ua*(y2 - y1),
        seg1: ua >= 0 && ua <= 1,
        seg2: ub >= 0 && ub <= 1
    }
}
