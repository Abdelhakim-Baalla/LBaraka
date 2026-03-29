import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const SignIn = () => {
  return (
    <View>
      <Text>SignIn</Text>
      <Link href="/(auth)/sign-up" className="text-primary">Don't have an account? Sign Up</Link>
    </View>
  )
}

export default SignIn