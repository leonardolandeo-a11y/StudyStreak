import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from '../ui/AppIcon';
import { ProfileCover } from './ProfileCover';

export function ProfileHeader({ name, username, bio, avatar, banner, onEdit, children }: {
  name: string; username: string; bio?: string | null; avatar: string | null; banner: string | null;
  onEdit?: () => void; children?: ReactNode;
}) {
  const { theme: { colors } } = useAppearance();
  return <View testID="profile-header" style={{gap:14,paddingBottom:20,borderBottomWidth:1,borderColor:colors.border}}>
    <ProfileCover integrated name={name} avatar={avatar} banner={banner}/>
    <View style={{gap:7}}>
      <Text accessibilityRole="header" style={{color:colors.text,fontSize:26,fontWeight:'700'}}>{name}</Text>
      <Text style={{color:colors.muted,fontSize:14}}>@{username}</Text>
      {bio ? <Text style={{color:colors.text,fontSize:15,lineHeight:23}}>{bio}</Text> : null}
    </View>
    {children}
    {onEdit ? <NavigationPressable accessibilityRole="button" accessibilityLabel="Edit Profile" onPress={onEdit}
      style={{minHeight:48,paddingHorizontal:14,paddingVertical:10,borderRadius:8,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary}}>
      <AppIcon name="pencil" color={colors.primaryText} size={20}/><Text style={{color:colors.primaryText,fontSize:14,fontWeight:'700'}}>Edit Profile</Text>
    </NavigationPressable> : null}
  </View>;
}
