/* simple texture lookup */

uniform sampler2D colormap;

varying vec2 v_uv;
void main()
{
    gl_FragColor = texture2D(colormap,v_uv);
}