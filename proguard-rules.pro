# Nexus Mobile - ProGuard Rules for R8 Minification

# Coil3 Image Library - Minimal required classes for image loading
-keep class coil3.PlatformContext
-keep class coil3.network.okhttp.OkHttpNetworkFetcher { *; }
-keep class coil3.network.okhttp.OkHttpNetworkFetcher$OkHttpNetworkFetcherFactory { *; }
-keep interface coil3.network.NetworkFetcher { *; }

# OkHttp3 - Keep only what's needed
-keep class okhttp3.OkHttpClient { *; }
-keep class okhttp3.Request { *; }
-keep class okhttp3.Response { *; }
-keep class okhttp3.Interceptor { *; }
-dontwarn okhttp3.**

# Retrofit
-keep class retrofit2.Retrofit { *; }
-dontwarn retrofit2.**

# Gson
-keep class com.google.gson.Gson { *; }
-dontwarn com.google.gson.**

# Firebase
-keep class com.google.firebase.messaging.FirebaseMessaging { *; }
-dontwarn com.google.firebase.**

# React Native - Core classes only
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.bridge.ReactApplicationContext { *; }

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Suppress warnings for unavailable classes
-dontwarn android.app.backup.**
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**
