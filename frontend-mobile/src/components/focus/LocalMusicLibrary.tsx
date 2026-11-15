import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { useLocalMusic } from '../../hooks/useLocalMusic';
import { AcademicPanel } from '../academic/Academic';
import { ActionButton } from '../ui/ActionButton';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
export function LocalMusicLibrary({ music, ready }: { music: ReturnType<typeof useLocalMusic>; ready: boolean }) {
  const { theme: { colors } } = useAppearance();
  return <AcademicPanel>
    <Text accessibilityRole="header" style={{color:colors.text,fontSize:18,fontWeight:'600'}}>Imported music</Text>
    <Text style={{color:colors.muted,fontSize:12,lineHeight:18}}>Temporary library · up to 10 audio files, 50 MB each. Files stay on this device and are cleared when you leave Focus Studio.</Text>
    <ActionButton compact secondary title="Import Music" busy={music.importing} disabled={!ready} onPress={()=>{void music.importMusic();}}/>
    {music.importError || music.error ? <Text accessibilityRole="alert" style={{color:colors.error}}>{music.importError || music.error}</Text> : null}
    {!music.tracks.length ? <Text style={{color:colors.muted}}>Choose music from your device to build this session’s library.</Text> : null}
    {music.tracks.map(track=><View key={track.id} style={{flexDirection:'row',alignItems:'center',gap:8}}>
      <View style={{flex:1,minWidth:0,gap:4}}><Text numberOfLines={2} style={{color:colors.text}}>{track.name}</Text><Text style={{color:colors.muted,fontSize:12}}>{music.activeId===track.id?music.loading?'Preparing audio…':music.playing?'Playing':'Paused':'Ready'}</Text></View>
      <NavigationPressable accessibilityRole="button" accessibilityLabel={`${music.activeId===track.id&&music.playing?'Pause':'Play'} ${track.name}`} disabled={!ready} onPress={()=>{if(music.activeId===track.id&&music.playing)music.pause();else void music.play(track.id);}} style={{minWidth:60,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:8,backgroundColor:colors.surfaceRaised,borderWidth:1,borderColor:colors.borderStrong}}><Text style={{color:colors.text,fontSize:13}}>{music.activeId===track.id&&music.playing?'Pause':'Play'}</Text></NavigationPressable>
      <NavigationPressable accessibilityRole="button" accessibilityLabel={`Remove ${track.name}`} onPress={()=>music.remove(track.id)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><AppIcon name="trash" color={colors.error} size={20}/></NavigationPressable>
    </View>)}
  </AcademicPanel>;
}
