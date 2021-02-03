package com.example.fpl_assistant_app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;

/**
 * TODO: Replace the implementation with code for your data type.
 */
public class MyFixturesRecyclerViewAdapter extends RecyclerView.Adapter<MyFixturesRecyclerViewAdapter.ViewHolder> {

    private final ArrayList<Fixture> mValues;

    public MyFixturesRecyclerViewAdapter(ArrayList<Fixture> items) {
        mValues = items;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.fragment_item, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(final ViewHolder holder, int position) {
        holder.mItem = mValues.get(position);
        holder.button_value.setText(mValues.get(position).getFixtureName());
    }

    @Override
    public int getItemCount() {
        return mValues.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {
        public final View mView;
        public final Button button_value;
        public Fixture mItem;

        public ViewHolder(View view) {
            super(view);
            mView = view;
            button_value = (Button) view.findViewById(R.id.button_value);
        }
    }
}