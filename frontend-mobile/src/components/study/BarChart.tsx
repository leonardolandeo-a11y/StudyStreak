import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../constants/palette';
import { barPercent } from './chartPresentation';
export function BarChart({items,unit='min',label}:{items:{label:string;value:number}[];unit?:string;label:string}) {
 const [selected,setSelected]=useState<number|null>(null);
 const max=Math.max(0,...items.map(item=>item.value)); const active=selected===null?null:items[selected];
 return <View style={{gap:12}}><Text style={styles.heading}>{label}</Text><Text style={styles.caption}>Peak {max.toFixed(1)} {unit} · Swipe to explore</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{gap:6}}>
   {items.map((item,index)=><Pressable key={`${item.label}-${index}`} accessibilityRole="button" accessibilityLabel={`${item.label}: ${item.value.toFixed(1)} ${unit}`} accessibilityState={{selected:selected===index}} onPress={()=>setSelected(index)} style={styles.column}>
    <View style={styles.track}><View style={{height:barPercent(item.value,max)*1.3,width:28,borderTopLeftRadius:5,borderTopRightRadius:5,backgroundColor:selected===index?'#c6f7e1':palette.primary}}/></View>
    <Text style={styles.caption}>{item.label.length>7?item.label.slice(5):item.label}</Text>
   </Pressable>)}
  </ScrollView>
  <Text accessibilityLiveRegion="polite" style={styles.caption}>{active?`${active.label} · ${active.value.toFixed(1)} ${unit}`:max===0?'No confirmed time in this period.':'Tap a bar to inspect its recorded value.'}</Text>
 </View>;
}
const styles=StyleSheet.create({heading:{color:palette.text,fontSize:18,fontWeight:'700'},caption:{color:palette.muted,fontSize:13,lineHeight:19},column:{minWidth:48,alignItems:'center',gap:8,paddingBottom:8},track:{height:130,justifyContent:'flex-end',alignItems:'center',width:48,borderBottomWidth:1,borderColor:palette.border}});
