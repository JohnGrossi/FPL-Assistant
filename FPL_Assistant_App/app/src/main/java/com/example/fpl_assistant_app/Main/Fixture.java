package com.example.fpl_assistant_app.Main;

public class Fixture {
    public String fixtureName;
    public void setFixtureName(String fixtureName) {
        this.fixtureName = fixtureName;
    }
    public String getFixtureName() {
        return fixtureName;
    }

    @Override
    public String toString() {
        return fixtureName;
    }
}
