import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignUp = () => {
  return (
    <View className='mt-12'>
      <Text>SignUp</Text>
      <Link href="/(auth)/sign-in" className="text-primary">Already have an account? Sign In</Link>
      <Link href="/(tabs)/home" className="text-primary">Home</Link>
    </View>
  )
}

export default SignUp