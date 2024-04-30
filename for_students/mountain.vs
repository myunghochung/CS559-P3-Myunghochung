// mountains - displacement map based on the height map

varying vec2 v_uv;
uniform sampler2D colormap;
void main() {
    v_uv = uv;
    float height = max(max(texture2D(colormap, v_uv).r, texture2D(colormap, v_uv).g), texture2D(colormap, v_uv).b);   // get the white value

    // alter the position by raising it by the height
    // we know the direction from the normal (which should be a unit vector)
    vec3 pos = position + height*normal *.4;

    // the main output of the shader (the vertex position)
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}