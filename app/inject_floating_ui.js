const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

const floatingUI = `      {liveCelebrations.length > 0 && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.floatingBtnContainer,
            { transform: [{ translateX: pan.x as any }, { translateY: pan.y as any }] }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate('LiveCelebrationsChat', { celebrations: liveCelebrations })}
            style={styles.floatingBtn}
          >
            <Animated.Text style={[styles.floatingEmoji, { opacity: emojiAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
              {getEmoji()}
            </Animated.Text>
            <View style={styles.floatingIndicator} />
          </TouchableOpacity>
          <Text style={styles.floatingLabel}>Live Celebrations</Text>
        </Animated.View>
      )}

    </View>
  );
}`;

if (!homeContent.includes('styles.floatingBtnContainer,')) {
  // Find the exact place to replace
  homeContent = homeContent.replace(
    /<\/ScrollView>\s*<\/View>\s*\);\s*}\s*function GridItem/g,
    `</ScrollView>\n\n${floatingUI}\n\nfunction GridItem`
  );
  fs.writeFileSync(homePath, homeContent, 'utf8');
  console.log('Successfully injected floating UI JSX!');
} else {
  console.log('Floating UI is already present.');
}
