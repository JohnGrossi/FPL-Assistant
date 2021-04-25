package com.example.fpl_assistant_app.Main;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.recyclerview.widget.RecyclerView;

import com.example.fpl_assistant_app.R;

import java.util.ArrayList;

public class MyFixturesRecyclerViewAdapter extends RecyclerView.Adapter<MyFixturesRecyclerViewAdapter.ViewHolder> {

    private final ArrayList<Fixture> mValues;
    private OnFixtureListener mOnFixtureListener;

    public MyFixturesRecyclerViewAdapter(ArrayList<Fixture> items, OnFixtureListener onFixtureListener) {
        this.mValues = items;
        this.mOnFixtureListener = onFixtureListener;
    }

    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.fragment_item, parent, false);
        return new ViewHolder(view, mOnFixtureListener);
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

    public class ViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {
        public final View mView;
        public final Button button_value;
        public Fixture mItem;
        OnFixtureListener onFixtureListener;

        public ViewHolder(View view, OnFixtureListener onFixtureListener) {
            super(view);
            mView = view;
            button_value = (Button) view.findViewById(R.id.button_value);
            button_value.setOnClickListener(this);
            this.onFixtureListener = onFixtureListener;
        }

        @Override
        public void onClick(View v) {
            onFixtureListener.onFixtureClick(getAdapterPosition());
        }
    }

    public interface OnFixtureListener {
        void onFixtureClick(int position);
    }
}