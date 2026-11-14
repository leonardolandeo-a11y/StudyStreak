/** Three coarse silhouettes; each has one wrapped copy for a seamless 240-unit loop. */
export function PixelClouds({ color }: { color: string }) {
    const clouds=[
        {x:45,y:37,duration:'60s',shape:'M0 7h7V3h7V0h10v3h7v4h7v3H0z'},
        {x:125,y:51,duration:'75s',shape:'M0 6h6V2h8V0h8v2h6v4h7v3H0z'},
        {x:185,y:61,duration:'90s',shape:'M0 5h8V2h6V0h9v2h7v3h7v3H0z'},
    ];
    return <g data-pixel-clouds>{clouds.map((cloud,index)=><g key={index} className="auth-effect auth-effect-clouds" data-cloud-track={index}
        style={{animationDuration:cloud.duration}} fill={color}>
        {[0,240].map(offset=><path key={offset} data-cloud-copy={offset} transform={`translate(${cloud.x+offset} ${cloud.y})`} d={cloud.shape}/>)}
    </g>)}</g>;
}
