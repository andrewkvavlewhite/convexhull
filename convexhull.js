// var SAT = require('sat')
// import SAT './node_modules/sat/SAT.js'

export class ConvexHullManager {

  constructor( existinghulls ) {
    this.hulls = existinghulls
    this.q = null
    this.quadrants = [ -1, 1, 1, -1 ]
  }

  getHulls() {
    return this.hulls
  }

  // Returns octagonal polygon that contains the circle
  circleToHull({ center:{ x, y }, radius }) {
    let hull = []
    let adj = Math.sqrt( Math.pow( radius, 2 ) * 2 ) - radius
    let hyp = Math.sqrt( Math.pow( adj, 2 ) * 2 )

    let magnitudes = [ -1, 1 ]
    let axis = [ 'x', 'y' ]
    let a = true
    for( let i = 0; i < 4; magnitudes[ !a|0 ] *= -1, i++, a = !a ) {
      let p = {
        x: x + magnitudes[ 0 ] * radius,
        y: y + magnitudes[ 1 ] * radius
      }
      for( let j = 0, k = !a; j < 2; j++, k = !k ) {
        let point = {}
        point[ axis[ !k|0 ]] = p[ axis[ !k|0 ]] - magnitudes[ !k|0 ] * hyp
        point[ axis[ k|0 ]] = p[ axis[ k|0 ] ]
        hull.push( point )
      }
    }
    return hull
  }

  mergeHulls( h1, h2 ) {
    this.hulls = [ h1 ]
    return this.addHull( h2 )
  }

  addHull( hull ) {
    let tangentPoints = []
    let i = 0
    // for( let i = 0; i < this.hulls.length; i++ ) {
    while( i < this.hulls.length ) {

      if( !this.isOverlapping( this.hulls[ i ], hull )) {
        i++
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
        let tangent = this.getNextTanget( hulls[ h|0 ], hulls[ !h|0 ], idx[ h|0 ], idx[ !h|0 ], maximas[ h|0 ], maximas[ !h|0 ])
        console.log(( bound % 2 ? 'UPPER' : 'LOWER' ) + ' TANGENT FOUND!')

        idx [ h|0 ] = tangent[ 0 ]
        idx [ !h|0 ] = tangent[ 1 ]

        if( idx[ h|0 ] >= hulls[ h|0 ].length - 1 && idx[ !h|0 ] >= hulls[ !h|0 ].length - 1 && bound % 2 == 0 ) {
          break
        }

        tangents.push( tangent )
        tangentPoints.push( hulls[ h|0 ][ idx [ h|0 ]])
        tangentPoints.push( hulls[ !h|0 ][ idx [ !h|0 ]])

        // if polygon ends on a lower bound, most likely the other polygon is fully contained
        // so to avoid errors, break immediately
        if( idx[ h|0 ] == hulls[ h|0 ].length - 1 && bound % 2 == 0 ) {
          break
        }
      }

      h = maximas[ 1 ][ 0 ].value < maximas[ 0 ][ 0 ].value

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
    let maxima1 = m1[ this.q % 4 ].value
    let maxima2 = m2[ this.q % 4 ].value
    let next_maxima1 = m1[( this.q +1 ) % 4 ].value
    let next_maxima2 = m2[( this.q + 1 ) % 4 ].value

    if(( i1 > 0 || i2 > 0 ) && this.isOutsideMaxima( next_maxima1, next_maxima2, next_quadrant )) {
      while( next_quadrant * ( p2[ next_axis ] - next_maxima2 ) < 0 ) {
        i2++
        p2 = this.getPoint( h2, i2 )
      }
      while( next_quadrant * ( p1[ next_axis ] - next_maxima1 ) < 0 ) {
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

      console.log(this.q, p2[ next_axis ], next_maxima2)

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
    let polygons = []
    for( let h of arguments ) {
      let points = []
      for( let i = h.length - 1; i >= 0; i-- ) {
        points.push( new SAT.Vector( h[ i ].x, h[ i ].y ))
      }
      polygons.push(
        new SAT.Polygon(new SAT.Vector(), points ))
    }
    return SAT.testPolygonPolygon( polygons[ 0 ], polygons[ 1 ])
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

  getMaximas( h1, h2 ) {
    let m = []
    for( let i in arguments ) {
      m.push([{ axis: 'x' }, { axis: 'y' }, { axis: 'x' }, { axis: 'y' }])
      for( let q = 0, j = 0; q < 4; j++ ) {
        let p = this.getPoint( arguments[ i ], j )
        let _p = this.getPoint( arguments[ i ], j + 1 )
        let a = m[ i ][ q ].axis
  
        if( this.quadrants[ q ] * ( _p[ a ] - p[ a ]) < 0) {
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
  
  toRadians( degrees ) {
    return degrees * Math.PI / 180;
  }

  toDegrees( radians ) {
    return radians * 180 / Math.PI;
  }

  distance( p1, p2 ) {
    return Math.sqrt(Math.abs((p1.x-p2.x)*(p1.x-p2.x) + (p1.y-p2.y)*(p1.y-p2.y)))
  }

}
